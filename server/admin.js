// ChatGenius AI Backend - Admin Dashboard API (MySQL)
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pool } = require('./config');
const { sendInvoiceIssuedEmail } = require('./mail');

const router = express.Router();

// Configuration
let ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET 必须配置且长度 >= 32 字符！');
  process.exit(1);
}
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// ==================== Login Rate Limiter ====================
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_MAP_MAX_SIZE = 10000; // LRU 上限，防止海量 IP 攻击撑大内存

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
    // LRU 保护：超过上限时删除最旧的条目
    if (loginAttempts.size >= LOGIN_MAP_MAX_SIZE) {
      const oldestKey = loginAttempts.keys().next().value;
      loginAttempts.delete(oldestKey);
    }
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

// P2-4 修复：generateBatchId 改用 crypto.randomBytes 替代 Math.random()
function generateBatchId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const bytes = crypto.randomBytes(8);
  const seq = bytes.toString('hex').toUpperCase();
  return `BATCH-${date}-${seq}`;
}

// P2-1 修复：CSV 公式注入防护
function csvEscape(value) {
  const s = String(value == null ? '' : value);
  // 转义内部双引号
  const escaped = s.replace(/"/g, '""');
  // 公式注入防护：以 = + - @ | % 开头则前缀单引号
  if (/^[=+\-@|%]/.test(escaped)) {
    return "'" + escaped;
  }
  return escaped;
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
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.sessionId) {
      // P2-6 修复：session 过期校验（创建超过 7 天视为过期）
      const [sessions] = await pool.query(
        'SELECT revoked FROM admin_sessions WHERE session_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)',
        [decoded.sessionId]
      );
      if (sessions.length === 0 || sessions[0].revoked) {
        return res.status(401).json({ error: '会话已失效，请重新登录' });
      }
      // P3-5 修复：捕获 updateSessionActivity 的 Promise rejection
      updateSessionActivity(decoded.sessionId).catch(err =>
        console.warn('updateSessionActivity failed:', err.message)
      );
    }
    req.adminSession = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// ==================== Public Settings (无需认证) ====================
// 仅返回非敏感的公开设置项，供前台展示
router.get('/public-settings', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('contact.qqGroup', 'contact.qqGroupLink', 'payment.productName')"
    );
    const result = {};
    rows.forEach(s => { result[s.setting_key] = s.setting_value; });
    res.json(result);
  } catch (err) {
    console.error('Get public settings error:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

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

  const passwordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

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

    if (decoded.sessionId) {
      const [sessions] = await pool.query(
        'SELECT revoked FROM admin_sessions WHERE session_id = ?',
        [decoded.sessionId]
      );
      if (sessions.length === 0 || sessions[0].revoked) {
        return res.status(401).json({ error: '会话已失效，请重新登录' });
      }
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

  const oldPasswordValid = await bcrypt.compare(oldPassword, ADMIN_PASSWORD_HASH);

  if (!oldPasswordValid) {
    await auditLog('password_change_failed', req, '旧密码验证失败');
    return res.status(401).json({ error: '旧密码错误' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  // P2-5 修复：.env 写入失败不影响密码更新（密码 hash 已在内存中更新）
  let envWriteWarning = null;
  try {
    // Update .env file（原子写入：先写临时文件再 rename，避免写入中断导致配置损坏）
    const envPath = path.resolve(__dirname, '.env');
    const tmpPath = envPath + '.tmp';
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('ADMIN_PASSWORD=')) {
      envContent = envContent.replace(/ADMIN_PASSWORD=.*/, `ADMIN_PASSWORD=${newHash}`);
    } else {
      envContent += `\nADMIN_PASSWORD=${newHash}\n`;
    }
    fs.writeFileSync(tmpPath, envContent, 'utf8');
    fs.renameSync(tmpPath, envPath);
  } catch (envError) {
    console.warn('Failed to update .env file (password updated in memory only):', envError.message);
    envWriteWarning = '注意：.env 文件更新失败，密码仅在内存中生效，重启服务后需重新设置。';
  }

  // Update in-memory variable so current session works immediately
  ADMIN_PASSWORD_HASH = newHash;

  await auditLog('password_changed', req, '密码已修改');

  res.json({
    success: true,
    message: envWriteWarning || '密码已修改成功，无需重启服务'
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
    const dayOfWeek = today.getDay();
    weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's revenue
    const [todayRows] = await pool.query(
      'SELECT COALESCE(SUM(CAST(price AS DECIMAL)), 0) as total FROM orders WHERE status = ? AND completed_at >= ? AND completed_at < ?',
      ['completed', today, tomorrow]
    );
    const todayRevenue = parseFloat(todayRows[0].total || 0);

    // Week revenue
    const [weekRows] = await pool.query(
      'SELECT COALESCE(SUM(CAST(price AS DECIMAL)), 0) as total FROM orders WHERE status = ? AND completed_at >= ? AND completed_at < ?',
      ['completed', weekStart, tomorrow]
    );
    const weekRevenue = parseFloat(weekRows[0].total || 0);

    // Month revenue
    const [monthRows] = await pool.query(
      'SELECT COALESCE(SUM(CAST(price AS DECIMAL)), 0) as total FROM orders WHERE status = ? AND completed_at >= ? AND completed_at < ?',
      ['completed', monthStart, tomorrow]
    );
    const monthRevenue = parseFloat(monthRows[0].total || 0);

    // Total revenue
    const [totalRows] = await pool.query('SELECT COALESCE(SUM(CAST(price AS DECIMAL)), 0) as total FROM orders WHERE status = ?', ['completed']);
    const totalRevenue = parseFloat(totalRows[0].total || 0);

    // Today's activations
    const [todayActs] = await pool.query(
      'SELECT COUNT(*) as cnt FROM activation_codes WHERE status = ? AND used_at >= ? AND used_at < ?',
      ['used', today, tomorrow]
    );
    const todayActivations = todayActs[0].cnt || 0;

    // Week activations
    const [weekActs] = await pool.query(
      'SELECT COUNT(*) as cnt FROM activation_codes WHERE status = ? AND used_at >= ? AND used_at < ?',
      ['used', weekStart, tomorrow]
    );
    const weekActivations = weekActs[0].cnt || 0;

    // Active licenses
    const [activeLic] = await pool.query(
      'SELECT COUNT(*) as cnt FROM licenses WHERE is_active = TRUE'
    );
    const activeLicenses = activeLic[0].cnt || 0;

    // Expiring soon (within 30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const [expiringLic] = await pool.query(
      'SELECT COUNT(*) as cnt FROM licenses WHERE is_active = TRUE AND expires_at IS NOT NULL AND expires_at <= ? AND expires_at > ?',
      [thirtyDaysLater, new Date()]
    );
    const expiringSoon = expiringLic[0].cnt || 0;

    // Recent orders
    const [recentOrders] = await pool.query(
      'SELECT order_no, plan, price, status, channel, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
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
        price: o.price || '0',
        status: o.status,
        channel: o.channel,
        createdAt: o.created_at
      })),
      channelStats: channelStats.map(c => ({
        channel: c.channel,
        count: parseInt(c.cnt),
        total: parseFloat(c.total || 0).toFixed(2)
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

    let sql, params;
    if (metric === 'revenue') {
      sql = "SELECT DATE(completed_at) as day, COALESCE(SUM(CAST(price AS DECIMAL)), 0) as total FROM orders WHERE status = 'completed' AND completed_at >= ? AND completed_at < ? GROUP BY DATE(completed_at)";
      params = [startDate, endDate];
    } else if (metric === 'activations') {
      sql = "SELECT DATE(used_at) as day, COUNT(*) as cnt FROM activation_codes WHERE status = 'used' AND used_at >= ? AND used_at < ? GROUP BY DATE(used_at)";
      params = [startDate, endDate];
    } else if (metric === 'orders') {
      sql = "SELECT DATE(created_at) as day, COUNT(*) as cnt FROM orders WHERE created_at >= ? AND created_at < ? GROUP BY DATE(created_at)";
      params = [startDate, endDate];
    } else {
      return res.status(400).json({ error: '无效的指标类型' });
    }

    const [rows] = await pool.query(sql, params);

    const valueMap = new Map();
    rows.forEach(row => {
      const d = new Date(row.day);
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      valueMap.set(key, metric === 'revenue' ? parseFloat(row.total) : parseInt(row.cnt));
    });

    const labels = [];
    const values = [];
    let total = 0;

    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      labels.push(`${mm}-${dd}`);

      const val = valueMap.get(`${mm}-${dd}`) || 0;
      values.push(metric === 'revenue' ? val.toFixed(2) : val);
      total += val;
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
  let limitNum = parseInt(limit);
  if (limitNum > 200) limitNum = 200;

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
      return `"${csvEscape(time)}","${csvEscape(log.action)}","${csvEscape(log.admin_ip)}","${csvEscape(log.user_agent || '')}","${csvEscape(log.method || '')}","${csvEscape(log.path || '')}","${csvEscape(log.details || '')}"`;
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
      return `"${csvEscape(code.code)}","${csvEscape(typeMap[code.type] || code.type)}","${csvEscape(statusMap[code.status] || code.status)}","${csvEscape(code.batch_id || '')}","${csvEscape(code.note || '')}","${csvEscape(code.created_at ? new Date(code.created_at).toLocaleString('zh-CN') : '')}","${csvEscape(code.used_at ? new Date(code.used_at).toLocaleString('zh-CN') : '')}"`;
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
  let limitNum = parseInt(limit);
  if (limitNum > 200) limitNum = 200;

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
      startDate.setHours(0, 0, 0, 0);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
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
      const price = parseFloat(order.price || 0) || 0;

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
  const { status, startDate, endDate, minPrice, maxPrice, userEmail, orderNo, search, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  let limitNum = parseInt(limit);
  if (limitNum > 200) limitNum = 200;

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
    if (search) {
      whereClause += ' AND (order_no LIKE ? OR user_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as cnt FROM orders WHERE ${whereClause}`, params);
    const total = countRows[0].cnt;

    const [orders] = await pool.query(
      `SELECT id, order_no, plan, price, type, channel, status, created_at, completed_at, activation_code, user_email, alipay_trade_no, wechat_trade_no, refund_reason, refunded_at FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    const [summaryRows] = await pool.query(
      `SELECT COUNT(*) as cnt, COALESCE(SUM(CAST(price AS DECIMAL)), 0) as total FROM orders WHERE ${whereClause}`,
      params
    );
    const summaryAmount = summaryRows[0].total;
    const summaryCount = summaryRows[0].cnt;

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
        count: summaryCount,
        amount: parseFloat(summaryAmount).toFixed(2)
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
      price: order.price || '0',
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

router.get('/orders/export', requireAdmin, async (req, res) => {
  const { status, startDate, endDate } = req.query;

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

    const [orders] = await pool.query(
      `SELECT order_no, plan, price, type, channel, status, created_at, completed_at, user_email, alipay_trade_no, wechat_trade_no FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT 10000`,
      params
    );

    const BOM = '\uFEFF';
    const header = '订单号,套餐,金额,类型,渠道,状态,创建时间,完成时间,邮箱,支付宝流水号,微信流水号\n';
    const channelNames = { alipay: '支付宝', wechat: '微信', paypal: 'PayPal' };
    const typeNames = { year: '年付', lifetime: '永久' };
    const statusNames = { pending: '待支付', completed: '已完成', refunded: '已退款', cancelled: '已取消' };
    const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '';
    const rows = orders.map(o => {
      return `"${csvEscape(o.order_no)}","${csvEscape(o.plan || '')}","${csvEscape(o.price || '')}","${csvEscape(typeNames[o.type] || o.type)}","${csvEscape(channelNames[o.channel] || o.channel)}","${csvEscape(statusNames[o.status] || o.status)}","${csvEscape(formatDate(o.created_at))}","${csvEscape(formatDate(o.completed_at))}","${csvEscape(o.user_email || '')}","${csvEscape(o.alipay_trade_no || '')}","${csvEscape(o.wechat_trade_no || '')}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`);
    res.send(BOM + header + rows);
  } catch (err) {
    console.error('Export orders error:', err);
    res.status(500).json({ error: '导出失败' });
  }
});

router.post('/orders/:orderNo/complete', requireAdmin, async (req, res) => {
  const { orderNo } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    // H1 修复：FOR UPDATE 锁定订单行，INSERT activation_codes + UPDATE orders 在同一事务，避免产生孤立激活码
    const [rows] = await conn.query('SELECT id, status, type, activation_code FROM orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ error: '订单不存在' }); }
    const order = rows[0];
    if (order.status === 'completed' && order.activation_code) { await conn.rollback(); return res.status(400).json({ error: '订单已完成且已分配激活码' }); }
    // 若已完成但无 activation_code，继续执行生成逻辑

    const type = order.type || 'year';
    const prefixMap = { year: 'YEAR', lifetime: 'PRO' };
    const prefix = prefixMap[type] || 'YEAR';
    const code = generateSecureCode(prefix);

    await conn.query(
      'INSERT INTO activation_codes (code, type, status, batch_id) VALUES (?, ?, ?, ?)',
      [code, type, 'unused', generateBatchId()]
    );

    await conn.query(
      'UPDATE orders SET status = ?, completed_at = ?, activation_code = ? WHERE id = ?',
      ['completed', new Date(), code, order.id]
    );

    await conn.commit();
    await auditLog('order_completed', req, `手动完成订单 ${orderNo}，生成激活码 ${code}`);
    res.json({ success: true, activationCode: code });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Complete order error:', err);
    res.status(500).json({ error: '完成订单失败' });
  } finally {
    if (conn) conn.release();
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
    // P2-3 修复：退款逻辑提示 —— 当前仅改 DB 状态不调退款 API，需提示管理员手动发起实际退款
    res.json({
      success: true,
      message: '订单已标记为已退款，许可证已撤销。请注意：需在支付宝/微信商户后台手动发起实际退款。',
      orderNo: orderNo
    });
  } catch (err) {
    console.error('Refund order error:', err);
    res.status(500).json({ error: '退款失败' });
  }
});

// ==================== Licenses ====================

router.get('/licenses', requireAdmin, async (req, res) => {
  const { type, isActive, search, activatedAfter, activatedBefore, expiringBefore, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  let limitNum = parseInt(limit);
  if (limitNum > 200) limitNum = 200;

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
      `SELECT id, activation_code, type, user_email, activated_at, expires_at, is_active, device_fingerprint, last_heartbeat, unbind_count, license_status FROM licenses WHERE ${whereClause} ORDER BY activated_at DESC LIMIT ? OFFSET ?`,
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
        isActive: license.is_active,
        deviceFingerprint: license.device_fingerprint,
        lastHeartbeat: license.last_heartbeat,
        unbindCount: license.unbind_count,
        licenseStatus: license.license_status,
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

    await pool.query('UPDATE licenses SET is_active = FALSE, device_fingerprint = NULL WHERE id = ?', [id]);
    await auditLog('license_revoked', req, `撤销许可证 ${rows[0].activation_code}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Revoke license error:', err);
    res.status(500).json({ error: '撤销许可证失败' });
  }
});

router.post('/licenses/:id/unbind', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // 获取 license 和关联的 activation_code
    const [rows] = await pool.query('SELECT id, activation_code FROM licenses WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '许可证不存在' });

    const license = rows[0];
    // 清除设备绑定（licenses 和 activation_codes 都清除）
    await pool.query('UPDATE licenses SET device_fingerprint = NULL WHERE id = ?', [id]);
    if (license.activation_code) {
      await pool.query('UPDATE activation_codes SET bound_fingerprint = NULL WHERE code = ?', [license.activation_code]);
    }

    await auditLog('license_unbind', req, `手动解绑许可证 #${id}（不计入用户换绑次数）`);
    res.json({ success: true, message: '设备已解绑' });
  } catch (err) {
    console.error('Unbind license error:', err);
    res.status(500).json({ error: '解绑失败' });
  }
});

router.post('/licenses/:id/reactivate', requireAdmin, async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    // H3 修复：SELECT 增加 expires_at，并检查过期；已激活且未过期才报错
    // M5 修复：加事务和行锁 FOR UPDATE 防并发竞态
    const [rows] = await conn.query('SELECT activation_code, is_active, type, expires_at FROM licenses WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: '许可证不存在' });
    }

    const lic = rows[0];
    const isExpired = lic.type === 'year' && lic.expires_at && new Date(lic.expires_at) < new Date();
    if (lic.is_active && !isExpired) {
      await conn.rollback();
      return res.status(400).json({ error: '许可证已有效' });
    }

    if (lic.type === 'year') {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await conn.query('UPDATE licenses SET is_active = TRUE, expires_at = ? WHERE id = ?', [expiresAt, id]);
    } else {
      await conn.query('UPDATE licenses SET is_active = TRUE WHERE id = ?', [id]);
    }

    await conn.commit();
    await auditLog('license_reactivated', req, `重新激活许可证 ${lic.activation_code}`);
    res.json({ success: true });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Reactivate license error:', err);
    res.status(500).json({ error: '重新激活失败' });
  } finally {
    if (conn) conn.release();
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
          // H2 修复：检查 expires_at 过期；暂停或过期都应允许重新激活
          const isExpired = license.type === 'year' && license.expires_at && new Date(license.expires_at) < new Date();
          if (!license.is_active || isExpired) {
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
          // H2 修复：移除 license.is_active 限制，让暂停的 license 也能续期；以 max(当前到期, now) 为基准
          const days = parseInt(params?.days);
          if (days > 0 && license.type !== 'lifetime') {
            const now = new Date();
            const currentExpiry = license.expires_at ? new Date(license.expires_at) : now;
            const base = currentExpiry > now ? currentExpiry : now;
            const newExpiry = new Date(base);
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

// ==================== IP Bans ====================

router.get('/ip-bans', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, ip, error_count, banned_until, created_at, updated_at FROM ip_bans ORDER BY updated_at DESC LIMIT 200'
    );
    res.json({
      items: rows.map(r => ({
        id: r.id,
        ip: r.ip,
        errorCount: r.error_count,
        bannedUntil: r.banned_until,
        isCurrentlyBanned: r.banned_until && new Date(r.banned_until) > new Date(),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))
    });
  } catch (err) {
    console.error('List IP bans error:', err);
    res.status(500).json({ error: '获取封禁列表失败' });
  }
});

router.post('/ip-bans/:id/unban', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE ip_bans SET banned_until = NULL, error_count = 0 WHERE id = ?', [id]);
    await auditLog('ip_unbanned', req, `解封 IP 封禁记录 #${id}`);
    res.json({ success: true, message: 'IP 已解封' });
  } catch (err) {
    console.error('Unban IP error:', err);
    res.status(500).json({ error: '解封失败' });
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

  // P2-2 修复：设置键名白名单（与 admin.html 实际使用的键保持一致）
  const ALLOWED_SETTING_KEYS = new Set([
    'contact.qqGroup',
    'contact.qqGroupLink',
    'payment.productName',
    'payment.priceYear',
    'payment.priceLifetime',
    'pricing.year',
    'pricing.lifetime',
    'security.ipWhitelist',
  ]);
  if (!ALLOWED_SETTING_KEYS.has(key)) {
    return res.status(400).json({ error: '不支持的设置项: ' + key });
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

// ==================== Invoice Management ====================

// GET /api/admin/invoices - 发票申请列表
router.get('/invoices', requireAdmin, async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  let limitNum = parseInt(limit);
  if (limitNum > 200) limitNum = 200;

  try {
    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    if (search) {
      whereClause += ' AND (i.order_no LIKE ? OR i.title LIKE ? OR i.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as cnt FROM invoice_requests i WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].cnt;

    const [invoices] = await pool.query(
      `SELECT i.id, i.order_no, i.invoice_type, i.title, i.tax_number, i.email,
              i.amount, i.status, i.invoice_url, i.remark, i.created_at, i.issued_at,
              o.plan, o.channel
       FROM invoice_requests i
       LEFT JOIN orders o ON i.order_no = o.order_no
       WHERE ${whereClause}
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    res.json({
      items: invoices.map(inv => ({
        id: inv.id,
        orderNo: inv.order_no,
        invoiceType: inv.invoice_type,
        title: inv.title,
        taxNumber: inv.tax_number,
        email: inv.email,
        amount: parseFloat(inv.amount || 0).toFixed(2),
        status: inv.status,
        invoiceUrl: inv.invoice_url,
        remark: inv.remark,
        createdAt: inv.created_at,
        issuedAt: inv.issued_at,
        plan: inv.plan,
        channel: inv.channel,
      })),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error('List invoices error:', err);
    res.status(500).json({ error: '获取发票列表失败' });
  }
});

// GET /api/admin/invoices/:id - 发票详情
router.get('/invoices/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT i.*, o.plan, o.channel, o.price as order_price
       FROM invoice_requests i
       LEFT JOIN orders o ON i.order_no = o.order_no
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '发票申请不存在' });
    }

    const inv = rows[0];
    res.json({
      id: inv.id,
      orderNo: inv.order_no,
      invoiceType: inv.invoice_type,
      title: inv.title,
      taxNumber: inv.tax_number,
      email: inv.email,
      amount: parseFloat(inv.amount || 0).toFixed(2),
      status: inv.status,
      invoiceUrl: inv.invoice_url,
      remark: inv.remark,
      createdAt: inv.created_at,
      issuedAt: inv.issued_at,
      plan: inv.plan,
      channel: inv.channel,
    });
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: '获取发票详情失败' });
  }
});

// POST /api/admin/invoices/:id/issue - 标记发票已开具
router.post('/invoices/:id/issue', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { invoiceUrl, remark } = req.body;

  if (!invoiceUrl) {
    return res.status(400).json({ error: '请提供发票下载链接' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, order_no, title, email, amount, status FROM invoice_requests WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '发票申请不存在' });
    }

    const inv = rows[0];
    if (inv.status === 'issued') {
      return res.status(400).json({ error: '该发票已开具' });
    }

    await pool.query(
      'UPDATE invoice_requests SET status = ?, invoice_url = ?, remark = ?, issued_at = ? WHERE id = ?',
      ['issued', invoiceUrl, remark || null, new Date(), id]
    );

    await auditLog('invoice_issued', req, `开具发票 #${id} 订单 ${inv.order_no}`);

    // 发送邮件通知用户
    const mailResult = await sendInvoiceIssuedEmail(inv.email, {
      title: inv.title,
      orderNo: inv.order_no,
      amount: inv.amount,
      invoiceUrl,
    });

    res.json({
      success: true,
      message: '发票已标记为已开具',
      emailSent: mailResult.success,
      emailError: mailResult.success ? undefined : mailResult.error,
    });
  } catch (err) {
    console.error('Issue invoice error:', err);
    res.status(500).json({ error: '操作失败' });
  }
});

// POST /api/admin/invoices/:id/reject - 拒绝发票申请
router.post('/invoices/:id/reject', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;

  if (!remark) {
    return res.status(400).json({ error: '请填写拒绝原因' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, order_no, status FROM invoice_requests WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '发票申请不存在' });
    }

    if (rows[0].status === 'issued') {
      return res.status(400).json({ error: '已开具的发票不能拒绝' });
    }

    await pool.query(
      'UPDATE invoice_requests SET status = ?, remark = ? WHERE id = ?',
      ['rejected', remark, id]
    );

    await auditLog('invoice_rejected', req, `拒绝发票申请 #${id} 订单 ${rows[0].order_no}`);

    res.json({ success: true, message: '发票申请已拒绝' });
  } catch (err) {
    console.error('Reject invoice error:', err);
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;
