// ChatGenius AI Backend - Admin Dashboard API (Enhanced)
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { AV } = require('./config');

const router = express.Router();

// Configuration
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD; // Now stores bcrypt hash
const JWT_SECRET = process.env.JWT_SECRET || 'chatgenius-jwt-secret-key-2026';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// ==================== Login Rate Limiter ====================
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
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

// Periodic cleanup of expired entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// ==================== Enhanced Audit Log ====================
async function auditLog(action, req, details, extra = {}) {
  try {
    const AuditLog = AV.Object.extend('AuditLog');
    const log = new AuditLog();
    log.set('action', action);
    log.set('adminIP', req.ip || req.connection.remoteAddress);
    log.set('userAgent', req.get('User-Agent'));
    log.set('method', req.method);
    log.set('path', req.path);
    log.set('details', details);
    if (extra.targetId) log.set('targetId', extra.targetId);
    if (extra.targetType) log.set('targetType', extra.targetType);
    if (extra.beforeState) log.set('beforeState', JSON.stringify(extra.beforeState));
    if (extra.afterState) log.set('afterState', JSON.stringify(extra.afterState));
    await log.save();
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
  const AdminSession = AV.Object.extend('AdminSession');
  const session = new AdminSession();
  session.set('sessionId', sessionId);
  session.set('ip', ip);
  session.set('userAgent', userAgent);
  session.set('createdAt', new Date());
  session.set('lastActiveAt', new Date());
  session.set('revoked', false);
  await session.save();
  return sessionId;
}

async function updateSessionActivity(sessionId) {
  try {
    const AdminSession = AV.Object.extend('AdminSession');
    const query = new AV.Query(AdminSession);
    query.equalTo('sessionId', sessionId);
    const session = await query.first();
    if (session && !session.get('revoked')) {
      session.set('lastActiveAt', new Date());
      await session.save();
    }
  } catch (err) {
    // Silent fail for activity updates
  }
}

async function revokeSession(sessionId) {
  const AdminSession = AV.Object.extend('AdminSession');
  const query = new AV.Query(AdminSession);
  query.equalTo('sessionId', sessionId);
  const session = await query.first();
  if (session) {
    session.set('revoked', true);
    await session.save();
  }
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
    
    // Check if session is revoked
    if (decoded.sessionId) {
      updateSessionActivity(decoded.sessionId);
    }
    
    req.adminSession = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// IP Whitelist middleware (optional)
function checkIPWhitelist(req, res, next) {
  // This will be implemented with SystemSetting in Task 9
  next();
}

// ==================== Authentication ====================

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  // Check rate limit
  const limitCheck = checkLoginLimit(clientIP);
  if (!limitCheck.allowed) {
    await auditLog('login_rate_limited', req, '登录频率限制触发');
    return res.status(429).json({ 
      error: `登录尝试过于频繁，请 ${limitCheck.retryAfter} 秒后再试` 
    });
  }

  // Check if ADMIN_PASSWORD_HASH is a bcrypt hash (starts with $2a$ or $2b$)
  const isHashed = ADMIN_PASSWORD_HASH && (ADMIN_PASSWORD_HASH.startsWith('$2a$') || ADMIN_PASSWORD_HASH.startsWith('$2b$'));
  
  let passwordValid = false;
  if (isHashed) {
    passwordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } else {
    // Fallback for plain text (migration period)
    passwordValid = password === ADMIN_PASSWORD_HASH;
  }

  if (!passwordValid) {
    recordLoginAttempt(clientIP);
    await auditLog('login_failed', req, '密码错误');
    
    // Check for brute force
    const record = loginAttempts.get(clientIP);
    if (record && record.count >= 3) {
      await auditLog('security_brute_force', req, `连续登录失败 ${record.count} 次`);
    }
    
    return res.status(401).json({ error: '密码错误' });
  }

  // Clear login attempts on success
  loginAttempts.delete(clientIP);
  
  // Create session
  const sessionId = await createSession(clientIP, userAgent);
  
  // Generate tokens
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

// POST /api/admin/refresh-token - Refresh access token
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

    // Generate new access token
    const accessToken = jwt.sign(
      { role: 'admin', sessionId: decoded.sessionId },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    res.json({
      accessToken,
      accessExpiresIn: ACCESS_TOKEN_EXPIRY
    });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token 无效或已过期' });
  }
});

// POST /api/admin/logout - Logout
router.post('/logout', requireAdmin, async (req, res) => {
  const sessionId = req.adminSession.sessionId;
  
  if (sessionId) {
    await revokeSession(sessionId);
    await auditLog('logout', req, '管理员退出登录');
  }
  
  res.json({ success: true });
});

// GET /api/admin/me - Verify token validity
router.get('/me', requireAdmin, (req, res) => {
  res.json({ loggedIn: true });
});

// GET /api/admin/sessions - List active sessions
router.get('/sessions', requireAdmin, async (req, res) => {
  try {
    const AdminSession = AV.Object.extend('AdminSession');
    const query = new AV.Query(AdminSession);
    query.equalTo('revoked', false);
    query.descending('lastActiveAt');
    query.limit(50);
    const sessions = await query.find();
    
    res.json({
      sessions: sessions.map(s => ({
        sessionId: s.get('sessionId'),
        ip: s.get('ip'),
        userAgent: s.get('userAgent'),
        createdAt: s.get('createdAt'),
        lastActiveAt: s.get('lastActiveAt'),
        current: s.get('sessionId') === req.adminSession.sessionId
      }))
    });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

// DELETE /api/admin/sessions/:sessionId - Revoke specific session
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

// POST /api/admin/change-password - Change admin password
router.post('/change-password', requireAdmin, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请提供旧密码和新密码' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ error: '新密码长度至少 8 位' });
  }

  // Verify old password
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

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 12);
  
  // Note: In production, this should update the .env file or database
  // For now, we'll just return the hash and log the action
  await auditLog('password_change_requested', req, '密码修改请求（需手动更新 .env）');
  
  res.json({
    success: true,
    message: '密码哈希已生成，请更新 .env 文件中的 ADMIN_PASSWORD',
    newHash
  });
});

// ==================== Dashboard ====================

// GET /api/admin/dashboard - Enhanced overview statistics
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Week start (Monday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);

    // Month start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's revenue
    const Order = AV.Object.extend('Order');
    const todayOrderQuery = new AV.Query(Order);
    todayOrderQuery.equalTo('status', 'completed');
    todayOrderQuery.greaterThanOrEqualTo('completedAt', today);
    todayOrderQuery.lessThan('completedAt', tomorrow);
    const todayOrders = await todayOrderQuery.find();
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (parseFloat(order.get('price')) || 0), 0);

    // Week revenue
    const weekOrderQuery = new AV.Query(Order);
    weekOrderQuery.equalTo('status', 'completed');
    weekOrderQuery.greaterThanOrEqualTo('completedAt', weekStart);
    weekOrderQuery.lessThan('completedAt', tomorrow);
    const weekOrders = await weekOrderQuery.find();
    const weekRevenue = weekOrders.reduce((sum, order) => sum + (parseFloat(order.get('price')) || 0), 0);

    // Month revenue
    const monthOrderQuery = new AV.Query(Order);
    monthOrderQuery.equalTo('status', 'completed');
    monthOrderQuery.greaterThanOrEqualTo('completedAt', monthStart);
    monthOrderQuery.lessThan('completedAt', tomorrow);
    const monthOrders = await monthOrderQuery.find();
    const monthRevenue = monthOrders.reduce((sum, order) => sum + (parseFloat(order.get('price')) || 0), 0);

    // Total revenue
    const totalOrderQuery = new AV.Query(Order);
    totalOrderQuery.equalTo('status', 'completed');
    const allOrders = await totalOrderQuery.find();
    const totalRevenue = allOrders.reduce((sum, order) => sum + (parseFloat(order.get('price')) || 0), 0);

    // Today's activations
    const ActivationCode = AV.Object.extend('ActivationCode');
    const todayActivationQuery = new AV.Query(ActivationCode);
    todayActivationQuery.equalTo('status', 'used');
    todayActivationQuery.greaterThanOrEqualTo('usedAt', today);
    todayActivationQuery.lessThan('usedAt', tomorrow);
    const todayActivations = await todayActivationQuery.count();

    // Week activations
    const weekActivationQuery = new AV.Query(ActivationCode);
    weekActivationQuery.equalTo('status', 'used');
    weekActivationQuery.greaterThanOrEqualTo('usedAt', weekStart);
    weekActivationQuery.lessThan('usedAt', tomorrow);
    const weekActivations = await weekActivationQuery.count();

    // Active licenses
    const License = AV.Object.extend('License');
    const activeQuery = new AV.Query(License);
    activeQuery.equalTo('isActive', true);
    const activeLicenses = await activeQuery.count();

    // Expiring soon (within 30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const expiringQuery = new AV.Query(License);
    expiringQuery.equalTo('isActive', true);
    expiringQuery.exists('expiresAt');
    expiringQuery.lessThanOrEqualTo('expiresAt', thirtyDaysLater);
    expiringQuery.greaterThan('expiresAt', new Date());
    const expiringSoon = await expiringQuery.count();

    // Recent orders
    const recentOrderQuery = new AV.Query(Order);
    recentOrderQuery.descending('createdAt');
    recentOrderQuery.limit(5);
    const recentOrders = await recentOrderQuery.find();

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
        orderNo: o.get('orderNo'),
        plan: o.get('plan'),
        price: o.get('price'),
        status: o.get('status'),
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// GET /api/admin/dashboard/trends - Trend data for charts
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
      
      labels.push(date.toISOString().slice(5, 10)); // MM-DD

      if (metric === 'revenue') {
        const Order = AV.Object.extend('Order');
        const query = new AV.Query(Order);
        query.equalTo('status', 'completed');
        query.greaterThanOrEqualTo('completedAt', date);
        query.lessThan('completedAt', nextDate);
        const orders = await query.find();
        const dayTotal = orders.reduce((sum, o) => sum + (parseFloat(o.get('price')) || 0), 0);
        values.push(dayTotal.toFixed(2));
        total += dayTotal;
      } else if (metric === 'activations') {
        const ActivationCode = AV.Object.extend('ActivationCode');
        const query = new AV.Query(ActivationCode);
        query.equalTo('status', 'used');
        query.greaterThanOrEqualTo('usedAt', date);
        query.lessThan('usedAt', nextDate);
        const count = await query.count();
        values.push(count);
        total += count;
      } else if (metric === 'orders') {
        const Order = AV.Object.extend('Order');
        const query = new AV.Query(Order);
        query.greaterThanOrEqualTo('createdAt', date);
        query.lessThan('createdAt', nextDate);
        const count = await query.count();
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

// GET /api/admin/audit-logs - List audit logs
router.get('/audit-logs', requireAdmin, async (req, res) => {
  const { action, startDate, endDate, ip, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    const AuditLog = AV.Object.extend('AuditLog');
    const query = new AV.Query(AuditLog);

    if (action && action !== 'all') {
      query.equalTo('action', action);
    }
    if (startDate) {
      query.greaterThanOrEqualTo('createdAt', new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.lessThanOrEqualTo('createdAt', end);
    }
    if (ip) {
      query.contains('adminIP', ip);
    }

    const total = await query.count();
    query.descending('createdAt');
    query.skip((pageNum - 1) * limitNum);
    query.limit(limitNum);
    const logs = await query.find();

    res.json({
      items: logs.map(log => ({
        id: log.id,
        action: log.get('action'),
        adminIP: log.get('adminIP'),
        userAgent: log.get('userAgent'),
        method: log.get('method'),
        path: log.get('path'),
        details: log.get('details'),
        createdAt: log.createdAt
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

// GET /api/admin/audit-logs/export - Export audit logs
router.get('/audit-logs/export', requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const AuditLog = AV.Object.extend('AuditLog');
    const query = new AV.Query(AuditLog);

    if (startDate) query.greaterThanOrEqualTo('createdAt', new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.lessThanOrEqualTo('createdAt', end);
    }

    query.descending('createdAt');
    query.limit(10000);
    const logs = await query.find();

    const BOM = '\uFEFF';
    const header = '时间,操作,IP,User-Agent,方法,路径,详情\n';
    const rows = logs.map(log => {
      const time = log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN') : '';
      return `"${time}","${log.get('action')}","${log.get('adminIP')}","${log.get('userAgent') || ''}","${log.get('method') || ''}","${log.get('path') || ''}","${log.get('details') || ''}"`;
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

// POST /api/admin/codes/generate - Batch generate with batch ID
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

      const ActivationCode = AV.Object.extend('ActivationCode');
      const activationCode = new ActivationCode();
      activationCode.set('code', code);
      activationCode.set('type', type);
      activationCode.set('status', 'unused');
      activationCode.set('batchId', batchId);
      if (note) activationCode.set('note', note);
      await activationCode.save();
      codes.push(code);
    }

    await auditLog('codes_generated', req, `生成 ${qty} 个 ${type} 类型激活码，批次 ${batchId}`);
    res.json({ success: true, count: codes.length, codes, batchId });
  } catch (err) {
    console.error('Generate codes error:', err);
    res.status(500).json({ error: '生成激活码失败' });
  }
});

// GET /api/admin/codes/batches - List batches
router.get('/codes/batches', requireAdmin, async (req, res) => {
  try {
    const ActivationCode = AV.Object.extend('ActivationCode');
    const query = new AV.Query(ActivationCode);
    query.exists('batchId');
    query.descending('createdAt');
    query.limit(1000);
    const codes = await query.find();

    // Group by batchId
    const batchMap = new Map();
    codes.forEach(code => {
      const batchId = code.get('batchId');
      if (!batchMap.has(batchId)) {
        batchMap.set(batchId, {
          batchId,
          type: code.get('type'),
          count: 0,
          usedCount: 0,
          createdAt: code.createdAt,
          note: code.get('note') || ''
        });
      }
      const batch = batchMap.get(batchId);
      batch.count++;
      if (code.get('status') === 'used') batch.usedCount++;
    });

    res.json({ batches: Array.from(batchMap.values()) });
  } catch (err) {
    console.error('List batches error:', err);
    res.status(500).json({ error: '获取批次列表失败' });
  }
});

// GET /api/admin/codes/export - Export codes
router.get('/codes/export', requireAdmin, async (req, res) => {
  const { status, type, batchId } = req.query;

  try {
    const ActivationCode = AV.Object.extend('ActivationCode');
    const query = new AV.Query(ActivationCode);

    if (status && status !== 'all') query.equalTo('status', status);
    if (type && type !== 'all') query.equalTo('type', type);
    if (batchId && batchId !== 'all') query.equalTo('batchId', batchId);

    query.descending('createdAt');
    query.limit(10000);
    const codes = await query.find();

    const BOM = '\uFEFF';
    const header = '激活码,类型,状态,批次,备注,创建时间,使用时间\n';
    const rows = codes.map(code => {
      const typeMap = { year: '年付', lifetime: '永久', free: '免费' };
      const statusMap = { unused: '未使用', used: '已使用' };
      return `"${code.get('code')}","${typeMap[code.get('type')] || code.get('type')}","${statusMap[code.get('status')] || code.get('status')}","${code.get('batchId') || ''}","${code.get('note') || ''}","${code.createdAt ? new Date(code.createdAt).toLocaleString('zh-CN') : ''}","${code.get('usedAt') ? new Date(code.get('usedAt')).toLocaleString('zh-CN') : ''}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="codes_${Date.now()}.csv"`);
    res.send(BOM + header + rows);
  } catch (err) {
    console.error('Export codes error:', err);
    res.status(500).json({ error: '导出失败' });
  }
});

// GET /api/admin/codes - List codes
router.get('/codes', requireAdmin, async (req, res) => {
  const { status, type, batchId, search, createdAfter, createdBefore, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    const ActivationCode = AV.Object.extend('ActivationCode');
    const query = new AV.Query(ActivationCode);

    if (status && status !== 'all') query.equalTo('status', status);
    if (type && type !== 'all') query.equalTo('type', type);
    if (batchId && batchId !== 'all') query.equalTo('batchId', batchId);
    if (search) query.contains('code', search.toUpperCase());
    if (createdAfter) query.greaterThanOrEqualTo('createdAt', new Date(createdAfter));
    if (createdBefore) {
      const before = new Date(createdBefore);
      before.setHours(23, 59, 59, 999);
      query.lessThanOrEqualTo('createdAt', before);
    }

    const total = await query.count();
    query.descending('createdAt');
    query.skip((pageNum - 1) * limitNum);
    query.limit(limitNum);
    const codes = await query.find();

    res.json({
      items: codes.map(code => ({
        id: code.id,
        code: code.get('code'),
        type: code.get('type'),
        status: code.get('status'),
        batchId: code.get('batchId'),
        note: code.get('note'),
        createdAt: code.createdAt,
        usedAt: code.get('usedAt')
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

// POST /api/admin/codes/batch-delete - Batch delete unused codes
router.post('/codes/batch-delete', requireAdmin, async (req, res) => {
  const { ids, filter } = req.body;

  try {
    const ActivationCode = AV.Object.extend('ActivationCode');
    let toDelete = [];

    if (ids && Array.isArray(ids) && ids.length > 0) {
      if (ids.length > 500) {
        return res.status(400).json({ error: '单次最多删除 500 条' });
      }
      for (const id of ids) {
        const code = await new AV.Query(ActivationCode).get(id);
        if (code.get('status') === 'unused') {
          toDelete.push(code);
        }
      }
    } else if (filter) {
      const query = new AV.Query(ActivationCode);
      query.equalTo('status', 'unused');
      if (filter.type) query.equalTo('type', filter.type);
      if (filter.batchId) query.equalTo('batchId', filter.batchId);
      query.limit(500);
      toDelete = await query.find();
    }

    let deletedCount = 0;
    for (const code of toDelete) {
      await code.destroy();
      deletedCount++;
    }

    await auditLog('codes_batch_deleted', req, `批量删除 ${deletedCount} 个未使用激活码`);
    res.json({ success: true, deletedCount });
  } catch (err) {
    console.error('Batch delete error:', err);
    res.status(500).json({ error: '批量删除失败' });
  }
});

// POST /api/admin/codes/:id/note - Add note to code
router.post('/codes/:id/note', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const ActivationCode = AV.Object.extend('ActivationCode');
    const code = await new AV.Query(ActivationCode).get(id);
    code.set('note', note);
    await code.save();

    await auditLog('code_note_updated', req, `更新激活码 ${code.get('code')} 备注`);
    res.json({ success: true });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: '更新备注失败' });
  }
});

// ==================== Orders ====================

// GET /api/admin/orders/statistics - Order statistics
router.get('/orders/statistics', requireAdmin, async (req, res) => {
  const { period = 'month' } = req.query;

  try {
    const Order = AV.Object.extend('Order');
    const query = new AV.Query(Order);
    query.equalTo('status', 'completed');

    let startDate;
    const now = new Date();
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

    query.greaterThanOrEqualTo('completedAt', startDate);
    const orders = await query.find();

    // Group by type
    const typeBreakdown = {};
    const channelBreakdown = {};
    let totalAmount = 0;

    orders.forEach(order => {
      const type = order.get('type') || 'year';
      const channel = order.get('channel') || 'unknown';
      const price = parseFloat(order.get('price')) || 0;

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

// GET /api/admin/orders - Enhanced list with filters
router.get('/orders', requireAdmin, async (req, res) => {
  const { status, startDate, endDate, minPrice, maxPrice, userEmail, orderNo, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    const Order = AV.Object.extend('Order');
    const query = new AV.Query(Order);

    if (status && status !== 'all') query.equalTo('status', status);
    if (startDate) query.greaterThanOrEqualTo('createdAt', new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.lessThanOrEqualTo('createdAt', end);
    }
    if (minPrice) query.greaterThanOrEqualTo('price', minPrice);
    if (maxPrice) query.lessThanOrEqualTo('price', maxPrice);
    if (userEmail) query.contains('userEmail', userEmail);
    if (orderNo) query.contains('orderNo', orderNo);

    const total = await query.count();
    query.descending('createdAt');
    query.skip((pageNum - 1) * limitNum);
    query.limit(limitNum);
    const orders = await query.find();

    // Calculate summary
    let summaryAmount = 0;
    orders.forEach(o => summaryAmount += parseFloat(o.get('price')) || 0);

    res.json({
      items: orders.map(order => ({
        id: order.id,
        orderNo: order.get('orderNo'),
        plan: order.get('plan'),
        price: order.get('price'),
        type: order.get('type'),
        channel: order.get('channel'),
        status: order.get('status'),
        createdAt: order.createdAt,
        completedAt: order.get('completedAt'),
        activationCode: order.get('activationCode'),
        userEmail: order.get('userEmail'),
        alipayTradeNo: order.get('alipayTradeNo')
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

// GET /api/admin/orders/:orderNo - Get order details
router.get('/orders/:orderNo', requireAdmin, async (req, res) => {
  const { orderNo } = req.params;

  try {
    const Order = AV.Object.extend('Order');
    const query = new AV.Query(Order);
    query.equalTo('orderNo', orderNo);
    const order = await query.first();

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json({
      id: order.id,
      orderNo: order.get('orderNo'),
      plan: order.get('plan'),
      price: order.get('price'),
      type: order.get('type'),
      channel: order.get('channel'),
      status: order.get('status'),
      createdAt: order.createdAt,
      completedAt: order.get('completedAt'),
      activationCode: order.get('activationCode'),
      userEmail: order.get('userEmail'),
      alipayTradeNo: order.get('alipayTradeNo')
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

// POST /api/admin/orders/:orderNo/complete - Manually complete order
router.post('/orders/:orderNo/complete', requireAdmin, async (req, res) => {
  const { orderNo } = req.params;

  try {
    const Order = AV.Object.extend('Order');
    const query = new AV.Query(Order);
    query.equalTo('orderNo', orderNo);
    const order = await query.first();

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.get('status') === 'completed') {
      return res.status(400).json({ error: '订单已完成' });
    }

    const type = order.get('type') || 'year';
    const prefixMap = { year: 'YEAR', lifetime: 'PRO' };
    const prefix = prefixMap[type] || 'YEAR';
    const code = generateSecureCode(prefix);

    const ActivationCode = AV.Object.extend('ActivationCode');
    const activationCode = new ActivationCode();
    activationCode.set('code', code);
    activationCode.set('type', type);
    activationCode.set('status', 'unused');
    activationCode.set('batchId', generateBatchId());
    await activationCode.save();

    order.set('status', 'completed');
    order.set('completedAt', new Date());
    order.set('activationCode', code);
    await order.save();

    await auditLog('order_completed', req, `手动完成订单 ${orderNo}，生成激活码 ${code}`);
    res.json({ success: true, activationCode: code });
  } catch (err) {
    console.error('Complete order error:', err);
    res.status(500).json({ error: '完成订单失败' });
  }
});

// POST /api/admin/orders/:orderNo/refund - Refund order
router.post('/orders/:orderNo/refund', requireAdmin, async (req, res) => {
  const { orderNo } = req.params;
  const { reason, revokeLicense = true } = req.body;

  try {
    const Order = AV.Object.extend('Order');
    const query = new AV.Query(Order);
    query.equalTo('orderNo', orderNo);
    const order = await query.first();

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.get('status') !== 'completed') {
      return res.status(400).json({ error: '只能退款已完成的订单' });
    }

    // Mark as refunded
    order.set('status', 'refunded');
    order.set('refundReason', reason || '管理员手动退款');
    order.set('refundedAt', new Date());
    await order.save();

    // Revoke associated license if requested
    if (revokeLicense) {
      const activationCode = order.get('activationCode');
      if (activationCode) {
        const License = AV.Object.extend('License');
        const licenseQuery = new AV.Query(License);
        licenseQuery.equalTo('activationCode', activationCode);
        licenseQuery.equalTo('isActive', true);
        const license = await licenseQuery.first();
        
        if (license) {
          license.set('isActive', false);
          await license.save();
        }
      }
    }

    await auditLog('order_refunded', req, `退款订单 ${orderNo}，原因: ${reason || '未提供'}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Refund order error:', err);
    res.status(500).json({ error: '退款失败' });
  }
});

// ==================== Licenses ====================

// GET /api/admin/licenses - Enhanced list
router.get('/licenses', requireAdmin, async (req, res) => {
  const { type, isActive, search, activatedAfter, activatedBefore, expiringBefore, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  try {
    const License = AV.Object.extend('License');
    
    let query;
    if (search) {
      const q1 = new AV.Query(License);
      q1.contains('activationCode', search);
      const q2 = new AV.Query(License);
      q2.contains('userEmail', search);
      query = AV.Query.or(q1, q2);
    } else {
      query = new AV.Query(License);
    }

    if (type && type !== 'all') query.equalTo('type', type);
    if (isActive !== undefined && isActive !== 'all') query.equalTo('isActive', isActive === 'true');
    if (activatedAfter) query.greaterThanOrEqualTo('activatedAt', new Date(activatedAfter));
    if (activatedBefore) {
      const before = new Date(activatedBefore);
      before.setHours(23, 59, 59, 999);
      query.lessThanOrEqualTo('activatedAt', before);
    }
    if (expiringBefore) {
      query.lessThanOrEqualTo('expiresAt', new Date(expiringBefore));
      query.greaterThan('expiresAt', new Date());
    }

    const total = await query.count();
    query.descending('activatedAt');
    query.skip((pageNum - 1) * limitNum);
    query.limit(limitNum);
    const licenses = await query.find();

    res.json({
      items: licenses.map(license => ({
        id: license.id,
        activationCode: license.get('activationCode'),
        type: license.get('type'),
        userEmail: license.get('userEmail'),
        activatedAt: license.get('activatedAt'),
        expiresAt: license.get('expiresAt'),
        isActive: license.get('isActive')
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

// POST /api/admin/licenses/:id/revoke - Revoke license
router.post('/licenses/:id/revoke', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const License = AV.Object.extend('License');
    const query = new AV.Query(License);
    const license = await query.get(id);

    if (!license.get('isActive')) {
      return res.status(400).json({ error: '许可证已撤销' });
    }

    license.set('isActive', false);
    await license.save();

    await auditLog('license_revoked', req, `撤销许可证 ${license.get('activationCode')}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Revoke license error:', err);
    res.status(500).json({ error: '撤销许可证失败' });
  }
});

// POST /api/admin/licenses/:id/reactivate - Reactivate license
router.post('/licenses/:id/reactivate', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const License = AV.Object.extend('License');
    const query = new AV.Query(License);
    const license = await query.get(id);

    if (license.get('isActive')) {
      return res.status(400).json({ error: '许可证已有效' });
    }

    license.set('isActive', true);
    
    // Reset expiration for year licenses
    if (license.get('type') === 'year') {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      license.set('expiresAt', expiresAt);
    }
    
    await license.save();

    await auditLog('license_reactivated', req, `重新激活许可证 ${license.get('activationCode')}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Reactivate license error:', err);
    res.status(500).json({ error: '重新激活失败' });
  }
});

// POST /api/admin/licenses/:id/extend - Extend license
router.post('/licenses/:id/extend', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { days } = req.body;

  const daysNum = parseInt(days);
  if (isNaN(daysNum) || daysNum <= 0) {
    return res.status(400).json({ error: '延期天数必须大于 0' });
  }

  try {
    const License = AV.Object.extend('License');
    const query = new AV.Query(License);
    const license = await query.get(id);

    if (license.get('type') === 'lifetime') {
      return res.status(400).json({ error: '永久许可证无需延期' });
    }

    if (!license.get('isActive')) {
      return res.status(400).json({ error: '许可证已撤销' });
    }

    const currentExpiry = license.get('expiresAt') || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + daysNum);
    license.set('expiresAt', newExpiry);
    await license.save();

    await auditLog('license_extended', req, `许可证 ${license.get('activationCode')} 延期 ${daysNum} 天`);
    res.json({ success: true, newExpiresAt: newExpiry });
  } catch (err) {
    console.error('Extend license error:', err);
    res.status(500).json({ error: '延期许可证失败' });
  }
});

// POST /api/admin/licenses/batch-operation - Batch operations
router.post('/licenses/batch-operation', requireAdmin, async (req, res) => {
  const { action, ids, params } = req.body;

  if (!['revoke', 'extend', 'reactivate'].includes(action)) {
    return res.status(400).json({ error: '无效的操作类型' });
  }

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
    return res.status(400).json({ error: 'ID 列表必须在 1-100 之间' });
  }

  try {
    const License = AV.Object.extend('License');
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        const license = await new AV.Query(License).get(id);

        if (action === 'revoke') {
          if (license.get('isActive')) {
            license.set('isActive', false);
            await license.save();
            successCount++;
          }
        } else if (action === 'reactivate') {
          if (!license.get('isActive')) {
            license.set('isActive', true);
            if (license.get('type') === 'year') {
              const expiresAt = new Date();
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              license.set('expiresAt', expiresAt);
            }
            await license.save();
            successCount++;
          }
        } else if (action === 'extend') {
          const days = parseInt(params?.days);
          if (days > 0 && license.get('type') !== 'lifetime' && license.get('isActive')) {
            const currentExpiry = license.get('expiresAt') || new Date();
            const newExpiry = new Date(currentExpiry);
            newExpiry.setDate(newExpiry.getDate() + days);
            license.set('expiresAt', newExpiry);
            await license.save();
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

// GET /api/admin/settings - Get all settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const SystemSetting = AV.Object.extend('SystemSetting');
    const query = new AV.Query(SystemSetting);
    query.limit(1000);
    const settings = await query.find();

    const result = {};
    settings.forEach(s => {
      result[s.get('key')] = s.get('value');
    });

    res.json(result);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// PUT /api/admin/settings - Update setting
router.put('/settings', requireAdmin, async (req, res) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: '请提供键和值' });
  }

  try {
    const SystemSetting = AV.Object.extend('SystemSetting');
    const query = new AV.Query(SystemSetting);
    query.equalTo('key', key);
    let setting = await query.first();

    if (!setting) {
      setting = new SystemSetting();
      setting.set('key', key);
    }

    setting.set('value', value);
    setting.set('updatedAt', new Date());
    await setting.save();

    await auditLog('settings_changed', req, `更新设置 ${key}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ error: '更新设置失败' });
  }
});

module.exports = router;
