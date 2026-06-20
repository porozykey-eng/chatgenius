// ChatGenius AI Backend - Admin Dashboard API (MySQL)
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('./config');

const router = express.Router();

// Configuration
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'chatgenius-jwt-secret-key-2026';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// ==================== Login Rate Limiter ====================
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

function checkLoginLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };
  if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((LOGIN_WINDOW_MS - (now - record.firstAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

function recordLoginAttempt(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { firstAttempt: now, count: 1 });
  } else {
    record.count++;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// ==================== Audit Log ====================
async function auditLog(action, req, details, extra = {}) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (action, admin_ip, user_agent, method, path, details, target_id, target_type, before_state, after_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        action,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        req.method,
        req.path,
        details,
        extra.targetId || null,
        extra.targetType || null,
        extra.beforeState ? JSON.stringify(extra.beforeState) : null,
        extra.afterState ? JSON.stringify(extra.afterState) : null,
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// ==================== Secure Code Generator ====================
function generateSecureCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len) => {
    const bytes = crypto.randomBytes(len);
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  return `${prefix}-${segment(4)}-${segment(4)}-${segment(4)}`;
}

function generateBatchId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BATCH-${date}-${seq}`;
}

// ==================== Session Management ====================
async function createSession(ip, userAgent) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  await pool.query(
    'INSERT INTO admin_sessions (session_id, ip, user_agent, created_at, last_active_at, revoked) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionId, ip, userAgent, new Date(), new Date(), false]
  );
  return sessionId;
}

async function updateSessionActivity(sessionId) {
  try {
    await pool.query(
      'UPDATE admin_sessions SET last_active_at = ? WHERE session_id = ? AND revoked = FALSE',
      [new Date(), sessionId]
    );
  } catch (err) {
    // Silent fail
  }
}

async function revokeSession(sessionId) {
  await pool.query(
    'UPDATE admin_sessions SET revoked = TRUE WHERE session_id = ?',
    [sessionId]
  );
}

// Authentication middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.sessionId) {
      updateSessionActivity(decoded.sessionId);
    }
    req.adminSession = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// ==================== Authentication ====================

router.post('/login', async (req, res) => {
  const { password } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  const limitCheck = checkLoginLimit(clientIP);
  if (!limitCheck.allowed) {
    await auditLog('login_rate_limited', req, '登录频率限制触发');
    return res.status(429).json({ 
      error: `登录尝试过于频繁，请 ${limitCheck.retryAfter} 秒后再试` 
    });
  }

  const isHashed = ADMIN_PASSWORD_HASH && (ADMIN_PASSWORD_HASH.startsWith('$2a$') || ADMIN_PASSWORD_HASH.startsWith('$2b$'));
  
  let passwordValid = false;
  if (isHashed) {
    passwordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else {
    passwordValid = password === ADMIN_PASSWORD_HASH;
  }

  if (!passwordValid) {
    recordLoginAttempt(clientIP);
    await auditLog('login_failed', req, '密码错误');
    
    const record = loginAttempts.get(clientIP);
    if (record && record.count >= 3) {
      await auditLog('security_brute_force', req, `连续登录失败 ${record.count} 次`);
    }
    
    return res.status(401).json({ error: '密码错误' });
  }

  loginAttempts.delete(clientIP);
  const sessionId = await createSession(clientIP, userAgent);
  
  const accessToken = jwt.sign(
    { role: 'admin', sessionId },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { role: 'admin', sessionId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  await auditLog('login_success', req, '管理员登录成功');
  res.json({
    accessToken,
    refreshToken,
    accessExpiresIn: ACCESS_TOKEN_EXPIRY,
    refreshExpiresIn: REFRESH_TOKEN_EXPIRY
  });
});

router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: '缺少 refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: '无效的 refresh token' });
    }

    const accessToken = jwt.sign(
      { role: 'admin', sessionId: decoded.sessionId },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    res.json({ accessToken, accessExpiresIn: ACCESS_TOKEN_EXPIRY });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token 无效或已过期' });
  }
});

router.post('/logout', requireAdmin, async (req, res) => {
  const sessionId = req.adminSession.sessionId;
  if (sessionId) {
    await revokeSession(sessionId);
    await auditLog('logout', req, '管理员退出登录');
  }
  res.json({ success: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ loggedIn: true });
});

router.get('/sessions', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT session_id, ip, user_agent, created_at, last_active_at FROM admin_sessions WHERE revoked = FALSE ORDER BY last_active_at DESC LIMIT 50'
    );
    
    res.json({
      sessions: rows.map(s => ({
        sessionId: s.session_id,
        ip: s.ip,
        userAgent: s.user_agent,
        createdAt: s.created_at,
        lastActiveAt: s.last_active_at,
        current: s.session_id === req.adminSession.sessionId
      }))
    });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

router.delete('/sessions/:sessionId', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;
  try {
    await revokeSession(sessionId);
    await auditLog('session_revoked', req, `强制下线会话 ${sessionId.substring(0, 8)}...`);
    res.json({ success: true });
  } catch (err) {
    console.error('Revoke session error:', err);
    res.status(500).json({ error: '撤销会话失败' });
  }
});

router.post('/change-password', requireAdmin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请提供旧密码和新密码' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ error: '新密码长度至少 8 位' });
  }

  const isHashed = ADMIN_PASSWORD_HASH && (ADMIN_PASSWORD_HASH.startsWith('$2a$') || ADMIN_PASSWORD_HASH.startsWith('$2b$'));
  let oldPasswordValid = false;
  
  if (isHashed) {
    oldPasswordValid = await bcrypt.compare(oldPassword, ADMIN_PASSWORD_HASH);
  } else {
    oldPasswordValid = oldPassword === ADMIN_PASSWORD_HASH;
  }

  if (!oldPasswordValid) {
    await auditLog('password_change_failed', req, '旧密码验证失败');
    return res.status(401).json({ error: '旧密码错误' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await auditLog('password_change_requested', req, '密码修改请求（需手动更新 .env）');
  
  res.json({
    success: true,
    message: '密码哈希已生成，请更新 .env 文件中的 ADMIN_PASSWORD',
    newHash
  });
});

// ==================== Dashboard ====================

router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's revenue
    const [todayOrders] = await pool.query(
      'SELECT price FROM orders WHERE status = ? AND completed_at >= ? AND completed_at < ?',
      ['completed', today, tomorrow]
    );
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);

    // Week revenue
    const [weekOrders] = await pool.query(
      'SELECT price FROM orders WHERE status = ? AND completed_at >= ? AND completed_at < ?',
      ['completed', weekStart, tomorrow]
    );
    const weekRevenue = weekOrders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);

    // Month revenue
    const [monthOrders] = await pool.query(
      'SELECT price FROM orders WHERE status = ? AND completed_at >= ? AND completed_at < ?',
      ['completed', monthStart, tomorrow]
    );
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);

    // Total revenue
    const [allOrders] = await pool.query('SELECT price FROM orders WHERE status = ?', ['completed']);
    const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);

    // Today's activations
    const [todayActs] = await pool.query(
      'SELECT COUNT(*) as cnt FROM activation_codes WHERE status = ? AND used_at >= ? AND used_at < ?',
      ['used', today, tomorrow]
    );
    const todayActivations = todayActs[0].cnt;

    // Week activations
    const [weekActs] = await pool.query(
      'SELECT COUNT(*) as cnt FROM activation_codes WHERE status = ? AND used_at >= ? AND used_at < ?',
      ['used', weekStart, tomorrow]
    );
    const weekActivations = weekActs[0].cnt;

    // Active licenses
    const [activeLic] = await pool.query(
      'SELECT COUNT(*) as cnt FROM licenses WHERE is_active = TRUE'
    );
    const activeLicenses = activeLic[0].cnt;

    // Expiring soon (within 30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const [expiringLic] = await pool.query(
      'SELECT COUNT(*) as cnt FROM licenses WHERE is_active = TRUE AND expires_at IS NOT NULL AND expires_at <= ? AND expires_at > ?',
      [thirtyDaysLater, new Date()]
    );
    const expiringSoon = expiringLic[0].cnt;

    // Recent orders
    const [recentOrders] = await pool.query(
      'SELECT order_no, plan, price, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
    );

    // Channel stats
    const [channelStats] = await pool.query(
      "SELECT channel, COUNT(*) as cnt, SUM(CAST(price AS DECIMAL)) as total FROM orders WHERE status = 'completed' GROUP BY channel"
    );

    res.json({
      todayRevenue: todayRevenue.toFixed(2),
      weekRevenue: weekRevenue.toFixed(2),
      monthRevenue: monthRevenue.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      todayActivations,
      weekActivations,
      activeLicenses,
      expiringSoon,
      recentOrders: recentOrders.map(o => ({
        orderNo: o.order_no,
        plan: o.plan,
        price: o.price,
        status: o.status,
        createdAt: o.created_at
      })),
      channelStats: channelStats.map(c => ({
        channel: c.channel,
        count: parseInt(c.cnt),
        total: parseFloat(c.total).toFixed(2)
      }))
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/dashboard/trends', requireAdmin, async (req, res) => {
  const { metric = 'revenue', days = 7 } = req.query;
  const numDays = parseInt(days);
  
  if (isNaN(numDays) || numDays < 1 || numDays > 365) {
    return res.status(400).json({ error: '天数必须在 1-365 之间' });
  }

  try {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - numDays + 1);
    startDate.setHours(0, 0, 0, 0);

    const labels = [];
    const values = [];
    let total = 0;

    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      labels.push(date.toISOString().slice(5, 10));

      if (metric === 'revenue') {
        const [orders] = await pool.query(
          'SELECT price FROM orders WHERE status = ? AND completed_at >= ? AND completed_at < ?',
          ['completed', date, nextDate]
        );
        const dayTotal = orders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);
        values.push(dayTotal.toFixed(2));
        total += dayTotal;
      } else if (metric === 'activations') {
        const [rows] = await pool.query(
          'SELECT COUNT(*) as cnt FROM activation_codes WHERE status = ? AND used_at >= ? AND used_at < ?',
          ['used', date, nextDate]
        );
        const count = rows[0].cnt;
        values.push(count);
        total += count;
      } else if (metric === 'orders') {
        const [rows] = await pool.query(
          'SELECT COUNT(*) as cnt FROM orders WHERE created_at >= ? AND created_at < ?',
          [date, nextDate]
        );
        const count = rows[0].cnt;
        values.push(count);
        total += count;
      }
    }

    res.json({ labels, values, total: metric === 'revenue' ? total.toFixed(2) : total });
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ error: '获取趋势数据失败' });
  }
});

// ==================== Audit Logs ====================

router.get('/audit-logs', requireAdmin, async (req, res) => {
  const { action, startDate, endDate, ip, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    let whereClause = '1=1';
    const params = [];

    if (action && action !== 'all') { whereClause += ' AND action = ?'; params.push(action); }
    if (startDate) { whereClause += ' AND created_at >= ?'; params.push(new Date(startDate)); }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause += ' AND created_at <= ?';
      params.push(end);
    }
    if (ip) { whereClause += ' AND admin_ip LIKE ?'; params.push(`%${ip}%`); }

    const [countRows] = await pool.query(`SELECT COUNT(*) as cnt FROM audit_logs WHERE ${whereClause}`, params);
    const total = countRows[0].cnt;

    const [logs] = await pool.query(
      `SELECT id, action, admin_ip, user_agent, method, path, details, created_at FROM audit_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    res.json({
      items: logs.map(log => ({
        id: log.id,
        action: log.action,
        adminIP: log.admin_ip,
        userAgent: log.user_agent,
        method: log.method,
        path: log.path,
        details: log.details,
        createdAt: log.created_at
      })),
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    console.error('List audit logs error:', err);
    res.status(500).json({ error: '获取审计日志失败' });
  }
});

router.get('/audit-logs/export', requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let whereClause = '1=1';
    const params = [];

    if (startDate) { whereClause += ' AND created_at >= ?'; params.push(new Date(startDate)); }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause += ' AND created_at <= ?';
      params.push(end);
    }

    const [logs] = await pool.query(
      `SELECT action, admin_ip, user_agent, method, path, details, created_at FROM audit_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT 10000`,
      params
    );

    const BOM = '\uFEFF';
    const header = '时间,操作,IP,User-Agent,方法,路径,详情\n';
    const rows = logs.map(log => {
      const time = log.created_at ? new Date(log.created_at).toLocaleString('zh-CN') : '';
      return `"${time}","${log.action}","${log.admin_ip}","${log.user_agent || ''}","${log.method || ''}","${log.path || ''}","${log.details || ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${Date.now()}.csv"`);
    res.send(BOM + header + rows);
  } catch (err) {
    console.error('Export audit logs error:', err);
    res.status(500).json({ error: '导出失败' });
  }
});

// ==================== Activation Codes ====================

router.post('/codes/generate', requireAdmin, async (req, res) => {
  const { type, quantity, note } = req.body;
  
  const validTypes = ['year', 'lifetime'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: '无效的激活码类型' });
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0 || qty > 100) {
    return res.status(400).json({ error: '生成数量必须在 1-100 之间' });
  }

  try {
    const codes = [];
    const prefixMap = { year: 'YEAR', lifetime: 'PRO' };
    const prefix = prefixMap[type];
    const batchId = generateBatchId();

    for (let i = 0; i < qty; i++) {
      const code = generateSecureCode(prefix);
      await pool.query(
        'INSERT INTO activation_codes (code, type, status, batch_id, note) VALUES (?, ?, ?, ?, ?)',
        [code, type, 'unused', batchId, note || null]
      );
      codes.push(code);
    }

    await auditLog('codes_generated', req, `生成 ${qty} 个 ${type} 类型激活码，批次 ${batchId}`);
    res.json({ success: true, count: codes.length, codes, batchId });
  } catch (err) {
    console.error('Generate codes error:', err);
    res.status(500).json({ error: '生成激活码失败' });
  }
});

router.get('/codes/batches', requireAdmin, async (req, res) => {
  try {
    const [codes] = await pool.query(
      'SELECT code, type, status, batch_id, note, created_at FROM activation_codes WHERE batch_id IS NOT NULL ORDER BY created_at DESC LIMIT 1000'
    );

    const batchMap = new Map();
    codes.forEach(code => {
      const batchId = code.batch_id;
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, {
          batchId,
          type: code.type,
          count: 0,
          usedCount: 0,
          createdAt: code.created_at,
          note: code.note || ''
        });
      }
      const batch = batchMap.get(batchId);
      batch.count++;
      if (code.status === 'used') batch.usedCount++;
    });

    res.json({ batches: Array.from(batchMap.values()) });
  } catch (err) {
    console.error('List batches error:', err);
    res.status(500).json({ error: '获取批次列表失败' });
  }
});

router.get('/codes/export', requireAdmin, async (req, res) => {
  const { status, type, batchId } = req.query;

  try {
    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') { whereClause += ' AND status = ?'; params.push(status); }
    if (type && type !== 'all') { whereClause += ' AND type = ?'; params.push(type); }
    if (batchId && batchId !== 'all') { whereClause += ' AND batch_id = ?'; params.push(batchId); }

    const [codes] = await pool.query(
      `SELECT code, type, status, batch_id, note, created_at, used_at FROM activation_codes WHERE ${whereClause} ORDER BY created_at DESC LIMIT 10000`,
      params
    );

    const BOM = '\uFEFF';
    const header = '激活码,类型,状态,批次,备注,创建时间,使用时间\n';
    const typeMap = { year: '年付', lifetime: '永久', free: '免费' };
    const statusMap = { unused: '未使用', used: '已使用' };
    const rows = codes.map(code => {
      return `"${code.code}","${typeMap[code.type] || code.type}","${statusMap[code.status] || code.status}","${code.batch_id || ''}","${code.note || ''}","${code.created_at ? new Date(code.created_at).toLocaleString('zh-CN') : ''}","${code.used_at ? new Date(code.used_at).toLocaleString('zh-CN') : ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="codes_${Date.now()}.csv"`);
    res.send(BOM + header + rows);
  } catch (err) {
    console.error('Export codes error:', err);
    res.status(500).json({ error: '导出失败' });
  }
});

router.get('/codes', requireAdmin, async (req, res) => {
  const { status, type, batchId, search, createdAfter, createdBefore, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') { whereClause += ' AND status = ?'; params.push(status); }
    if (type && type !== 'all') { whereClause += ' AND type = ?'; params.push(type); }
    if (batchId && batchId !== 'all') { whereClause += ' AND batch_id = ?'; params.push(batchId); }
    if (search) { whereClause += ' AND code LIKE ?'; params.push(`%${search.toUpperCase()}%`); }
    if (createdAfter) { whereClause += ' AND created_at >= ?'; params.push(new Date(createdAfter)); }
    if (createdBefore) {
      const before = new Date(createdBefore);
      before.setHours(23, 59, 59, 999);
      whereClause += ' AND created_at <= ?';
      params.push(before);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as cnt FROM activation_codes WHERE ${whereClause}`, params);
    const total = countRows[0].cnt;

    const [codes] = await pool.query(
      `SELECT id, code, type, status, batch_id, note, created_at, used_at FROM activation_codes WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    res.json({
      items: codes.map(code => ({
        id: code.id,
        code: code.code,
        type: code.type,
        status: code.status,
        batchId: code.batch_id,
        note: code.note,
        createdAt: code.created_at,
        usedAt: code.used_at
      })),
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    console.error('List codes error:', err);
    res.status(500).json({ error: '获取激活码列表失败' });
  }
});

router.post('/codes/batch-delete', requireAdmin, async (req, res) => {
  const { ids, filter } = req.body;

  try {
    let deletedCount = 0;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      if (ids.length > 500) {
        return res.status(400).json({ error: '单次最多删除 500 条' });
      }
      for (const id of ids) {
        const [rows] = await pool.query('SELECT status FROM activation_codes WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].status === 'unused') {
          await pool.query('DELETE FROM activation_codes WHERE id = ?', [id]);
          deletedCount++;
        }
      }
    } else if (filter) {
      let whereClause = 'status = ?';
      const params = ['unused'];
      if (filter.type) { whereClause += ' AND type = ?'; params.push(filter.type); }
      if (filter.batchId) { whereClause += ' AND batch_id = ?'; params.push(filter.batchId); }
      
      const [rows] = await pool.query(`SELECT id FROM activation_codes WHERE ${whereClause} LIMIT 500`, params);
      for (const row of rows) {
        await pool.query('DELETE FROM activation_codes WHERE id = ?', [row.id]);
        deletedCount++;
      }
    }

    await auditLog('codes_batch_deleted', req, `批量删除 ${deletedCount} 个未使用激活码`);
    res.json({ success: true, deletedCount });
  } catch (err) {
    console.error('Batch delete error:', err);
    res.status(500).json({ error: '批量删除失败' });
  }
});

router.post('/codes/:id/note', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    await pool.query('UPDATE activation_codes SET note = ? WHERE id = ?', [note, id]);
    await auditLog('code_note_updated', req, `更新激活码备注 ID:${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: '更新备注失败' });
  }
});

// ==================== Orders ====================

router.get('/orders/statistics', requireAdmin, async (req, res) => {
  const { period = 'month' } = req.query;

  try {
    const now = new Date();
    let startDate;
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }

    const [orders] = await pool.query(
      'SELECT type, channel, price FROM orders WHERE status = ? AND completed_at >= ?',
      ['completed', startDate]
    );

    const typeBreakdown = {};
    const channelBreakdown = {};
    let totalAmount = 0;

    orders.forEach(order => {
      const type = order.type || 'year';
      const channel = order.channel || 'unknown';
      const price = parseFloat(order.price) || 0;

      typeBreakdown[type] = (typeBreakdown[type] || 0) + price;
      channelBreakdown[channel] = (channelBreakdown[channel] || 0) + price;
      totalAmount += price;
    });

    res.json({
      totalCount: orders.length,
      totalAmount: totalAmount.toFixed(2),
      typeBreakdown,
      channelBreakdown
    });
  } catch (err) {
    console.error('Order statistics error:', err);
    res.status(500).json({ error: '获取订单统计失败' });
  }
});

router.get('/orders', requireAdmin, async (req, res) => {
  const { status, startDate, endDate, minPrice, maxPrice, userEmail, orderNo, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') { whereClause += ' AND status = ?'; params.push(status); }
    if (startDate) { whereClause += ' AND created_at >= ?'; params.push(new Date(startDate)); }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause += ' AND created_at <= ?';
      params.push(end);
    }
    if (minPrice) { whereClause += ' AND CAST(price AS DECIMAL) >= ?'; params.push(parseFloat(minPrice)); }
    if (maxPrice) { whereClause += ' AND CAST(price AS DECIMAL) <= ?'; params.push(parseFloat(maxPrice)); }
    if (userEmail) { whereClause += ' AND user_email LIKE ?'; params.push(`%${userEmail}%`); }
    if (orderNo) { whereClause += ' AND order_no LIKE ?'; params.push(`%${orderNo}%`); }

    const [countRows] = await pool.query(`SELECT COUNT(*) as cnt FROM orders WHERE ${whereClause}`, params);
    const total = countRows[0].cnt;

    const [orders] = await pool.query(
      `SELECT id, order_no, plan, price, type, channel, status, created_at, completed_at, activation_code, user_email, alipay_trade_no, wechat_trade_no, refund_reason, refunded_at FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    let summaryAmount = 0;
    orders.forEach(o => summaryAmount += parseFloat(o.price) || 0);

    res.json({
      items: orders.map(order => ({
        id: order.id,
        orderNo: order.order_no,
        plan: order.plan,
        price: order.price,
        type: order.type,
        channel: order.channel,
        status: order.status,
        createdAt: order.created_at,
        completedAt: order.completed_at,
        activationCode: order.activation_code,
        userEmail: order.user_email,
        alipayTradeNo: order.alipay_trade_no,
        wechatTradeNo: order.wechat_trade_no,
        refundReason: order.refund_reason,
        refundedAt: order.refunded_at
      })),
      total,
      page: pageNum,
      limit: limitNum,
      summary: {
        count: orders.length,
        amount: summaryAmount.toFixed(2)
      }
    });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/orders/:orderNo', requireAdmin, async (req, res) => {
  const { orderNo } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT id, order_no, plan, price, type, channel, status, created_at, completed_at, activation_code, user_email, alipay_trade_no, wechat_trade_no, refund_reason, refunded_at FROM orders WHERE order_no = ?',
      [orderNo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = rows[0];
    res.json({
      id: order.id,
      orderNo: order.order_no,
      plan: order.plan,
      price: order.price,
      type: order.type,
      channel: order.channel,
      status: order.status,
      createdAt: order.created_at,
      completedAt: order.completed_at,
      activationCode: order.activation_code,
      userEmail: order.user_email,
      alipayTradeNo: order.alipay_trade_no,
      wechatTradeNo: order.wechat_trade_no,
      refundReason: order.refund_reason,
      refundedAt: order.refunded_at
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

router.post('/orders/:orderNo/complete', requireAdmin, async (req, res) => {
  const { orderNo } = req.params;

  try {
    const [rows] = await pool.query('SELECT id, status, type FROM orders WHERE order_no = ?', [orderNo]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = rows[0];
    if (order.status === 'completed') {
      return res.status(400).json({ error: '订单已完成' });
    }

    const type = order.type || 'year';
    const prefixMap = { year: 'YEAR', lifetime: 'PRO' };
    const prefix = prefixMap[type] || 'YEAR';
    const code = generateSecureCode(prefix);

    await pool.query(
      'INSERT INTO activation_codes (code, type, status, batch_id) VALUES (?, ?, ?, ?)',
      [code, type, 'unused', generateBatchId()]
    );

    await pool.query(
      'UPDATE orders SET status = ?, completed_at = ?, activation_code = ? WHERE id = ?',
      ['completed', new Date(), code, order.id]
    );

    await auditLog('order_completed', req, `手动完成订单 ${orderNo}，生成激活码 ${code}`);
    res.json({ success: true, activationCode: code });
  } catch (err) {
    console.error('Complete order error:', err);
    res.status(500).json({ error: '完成订单失败' });
  }
});

router.post('/orders/:orderNo/refund', requireAdmin, async (req, res) => {
  const { orderNo } = req.params;
  const { reason, revokeLicense = true } = req.body;

  try {
    const [rows] = await pool.query('SELECT id, status, activation_code FROM orders WHERE order_no = ?', [orderNo]);

    if (rows.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = rows[0];
    if (order.status !== 'completed') {
      return res.status(400).json({ error: '只能退款已完成的订单' });
    }

    await pool.query(
      'UPDATE orders SET status = ?, refund_reason = ?, refunded_at = ? WHERE id = ?',
      ['refunded', reason || '管理员手动退款', new Date(), order.id]
    );

    if (revokeLicense && order.activation_code) {
      await pool.query(
        'UPDATE licenses SET is_active = FALSE WHERE activation_code = ? AND is_active = TRUE',
        [order.activation_code]
      );
    }

    await auditLog('order_refunded', req, `退款订单 ${orderNo}，原因: ${reason || '未提供'}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Refund order error:', err);
    res.status(500).json({ error: '退款失败' });
  }
});

// ==================== Licenses ====================

router.get('/licenses', requireAdmin, async (req, res) => {
  const { type, isActive, search, activatedAfter, activatedBefore, expiringBefore, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    let whereClause = '1=1';
    const params = [];

    if (type && type !== 'all') { whereClause += ' AND type = ?'; params.push(type); }
    if (isActive !== undefined && isActive !== 'all') { whereClause += ' AND is_active = ?'; params.push(isActive === 'true'); }
    if (activatedAfter) { whereClause += ' AND activated_at >= ?'; params.push(new Date(activatedAfter)); }
    if (activatedBefore) {
      const before = new Date(activatedBefore);
      before.setHours(23, 59, 59, 999);
      whereClause += ' AND activated_at <= ?';
      params.push(before);
    }
    if (expiringBefore) {
      whereClause += ' AND expires_at <= ? AND expires_at > ?';
      params.push(new Date(expiringBefore), new Date());
    }
    if (search) {
      whereClause += ' AND (activation_code LIKE ? OR user_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as cnt FROM licenses WHERE ${whereClause}`, params);
    const total = countRows[0].cnt;

    const [licenses] = await pool.query(
      `SELECT id, activation_code, type, user_email, activated_at, expires_at, is_active FROM licenses WHERE ${whereClause} ORDER BY activated_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    res.json({
      items: licenses.map(license => ({
        id: license.id,
        activationCode: license.activation_code,
        type: license.type,
        userEmail: license.user_email,
        activatedAt: license.activated_at,
        expiresAt: license.expires_at,
        isActive: license.is_active
      })),
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    console.error('List licenses error:', err);
    res.status(500).json({ error: '获取许可证列表失败' });
  }
});

router.post('/licenses/:id/revoke', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT activation_code, is_active FROM licenses WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '许可证不存在' });

    if (!rows[0].is_active) {
      return res.status(400).json({ error: '许可证已撤销' });
    }

    await pool.query('UPDATE licenses SET is_active = FALSE WHERE id = ?', [id]);
    await auditLog('license_revoked', req, `撤销许可证 ${rows[0].activation_code}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Revoke license error:', err);
    res.status(500).json({ error: '撤销许可证失败' });
  }
});

router.post('/licenses/:id/reactivate', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT activation_code, is_active, type FROM licenses WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '许可证不存在' });

    if (rows[0].is_active) {
      return res.status(400).json({ error: '许可证已有效' });
    }

    let updateSQL = 'UPDATE licenses SET is_active = TRUE WHERE id = ?';
    const updateParams = [id];

    if (rows[0].type === 'year') {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updateSQL = 'UPDATE licenses SET is_active = TRUE, expires_at = ? WHERE id = ?';
      updateParams.unshift(expiresAt);
    }

    await pool.query(updateSQL, updateParams);
    await auditLog('license_reactivated', req, `重新激活许可证 ${rows[0].activation_code}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Reactivate license error:', err);
    res.status(500).json({ error: '重新激活失败' });
  }
});

router.post('/licenses/:id/extend', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { days } = req.body;

  const daysNum = parseInt(days);
  if (isNaN(daysNum) || daysNum <= 0) {
    return res.status(400).json({ error: '延期天数必须大于 0' });
  }

  try {
    const [rows] = await pool.query('SELECT activation_code, type, is_active, expires_at FROM licenses WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '许可证不存在' });

    const license = rows[0];
    if (license.type === 'lifetime') {
      return res.status(400).json({ error: '永久许可证无需延期' });
    }
    if (!license.is_active) {
      return res.status(400).json({ error: '许可证已撤销' });
    }

    const currentExpiry = license.expires_at || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + daysNum);

    await pool.query('UPDATE licenses SET expires_at = ? WHERE id = ?', [newExpiry, id]);
    await auditLog('license_extended', req, `许可证 ${license.activation_code} 延期 ${daysNum} 天`);
    res.json({ success: true, newExpiresAt: newExpiry });
  } catch (err) {
    console.error('Extend license error:', err);
    res.status(500).json({ error: '延期许可证失败' });
  }
});

router.post('/licenses/batch-operation', requireAdmin, async (req, res) => {
  const { action, ids, params } = req.body;

  if (!['revoke', 'extend', 'reactivate'].includes(action)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
    return res.status(400).json({ error: 'ID 列表必须在 1-100 之间' });
  }

  try {
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        const [rows] = await pool.query('SELECT is_active, type, expires_at FROM licenses WHERE id = ?', [id]);
        if (rows.length === 0) { failCount++; continue; }

        const license = rows[0];

        if (action === 'revoke') {
          if (license.is_active) {
            await pool.query('UPDATE licenses SET is_active = FALSE WHERE id = ?', [id]);
            successCount++;
          }
        } else if (action === 'reactivate') {
          if (!license.is_active) {
            if (license.type === 'year') {
              const expiresAt = new Date();
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              await pool.query('UPDATE licenses SET is_active = TRUE, expires_at = ? WHERE id = ?', [expiresAt, id]);
            } else {
              await pool.query('UPDATE licenses SET is_active = TRUE WHERE id = ?', [id]);
            }
            successCount++;
          }
        } else if (action === 'extend') {
          const days = parseInt(params?.days);
          if (days > 0 && license.type !== 'lifetime' && license.is_active) {
            const currentExpiry = license.expires_at || new Date();
            const newExpiry = new Date(currentExpiry);
            newExpiry.setDate(newExpiry.getDate() + days);
            await pool.query('UPDATE licenses SET expires_at = ? WHERE id = ?', [newExpiry, id]);
            successCount++;
          }
        }
      } catch (err) {
        failCount++;
      }
    }

    await auditLog('license_batch_operation', req, `批量${action}操作，成功 ${successCount}，失败 ${failCount}`);
    res.json({ success: true, successCount, failCount });
  } catch (err) {
    console.error('Batch operation error:', err);
    res.status(500).json({ error: '批量操作失败' });
  }
});

// ==================== System Settings ====================

router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings LIMIT 1000');
    const result = {};
    rows.forEach(s => { result[s.setting_key] = s.setting_value; });
    res.json(result);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

router.put('/settings', requireAdmin, async (req, res) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: '请提供键和值' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM system_settings WHERE setting_key = ?', [key]);

    if (existing.length > 0) {
      await pool.query('UPDATE system_settings SET setting_value = ?, updated_at = ? WHERE setting_key = ?', [value, new Date(), key]);
    } else {
      await pool.query('INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)', [key, value, new Date()]);
    }

    await auditLog('settings_changed', req, `更新设置 ${key}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ error: '更新设置失败' });
  }
});

module.exports = router;
