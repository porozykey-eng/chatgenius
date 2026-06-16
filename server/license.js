// ChatGenius AI Backend - 许可证验证服务 (MySQL)
const express = require('express');
const { pool } = require('./config');

const router = express.Router();

// Activate code: atomically validate + mark used + create License
router.post('/activate', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }
  
  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const normalizedCode = code.toUpperCase();
    
    // Step 1: Query activation code with row lock (prevents race condition)
    const [rows] = await conn.query(
      'SELECT id, code, type, status, used_at FROM activation_codes WHERE code = ? FOR UPDATE',
      [normalizedCode]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.json({ valid: false, error: '激活码无效' });
    }

    const activationCode = rows[0];

    if (activationCode.status === 'used') {
      await conn.rollback();
      return res.json({ valid: false, error: '激活码已使用' });
    }

    const licenseType = activationCode.type;
    const now = new Date();

    // Step 2: Mark as used
    await conn.query(
      'UPDATE activation_codes SET status = ?, used_at = ? WHERE id = ?',
      ['used', now, activationCode.id]
    );

    // Step 3: Create License record
    const expiresAt = licenseType === 'year' 
      ? new Date(now.setFullYear(now.getFullYear() + 1)) 
      : null;

    await conn.query(
      'INSERT INTO licenses (activation_code, type, activated_at, expires_at, is_active) VALUES (?, ?, ?, ?, ?)',
      [normalizedCode, licenseType, new Date(), expiresAt, true]
    );

    await conn.commit();

    res.json({
      valid: true,
      type: licenseType,
      activatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Activate error:', error);
    res.status(500).json({ valid: false, error: '激活失败，请重试' });
  } finally {
    if (conn) conn.release();
  }
});

// 验证激活码 (read-only check)
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }
  
  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT code, type, status FROM activation_codes WHERE code = ?',
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, error: '激活码无效' });
    }

    if (rows[0].status === 'used') {
      return res.json({ valid: false, error: '激活码已使用' });
    }

    res.json({
      valid: true,
      type: rows[0].type,
    });
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({ valid: false, error: '验证失败' });
  }
});

// 查询许可证状态
router.get('/status/:code', async (req, res) => {
  const { code } = req.params;
  
  if (!code || typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ error: '无效的许可证编码' });
  }
  
  try {
    const [rows] = await pool.query(
      'SELECT type, expires_at, is_active FROM licenses WHERE activation_code = ? AND is_active = TRUE',
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.json({ active: false });
    }

    const license = rows[0];
    const isExpired = license.expires_at && new Date(license.expires_at) < new Date();

    if (isExpired) {
      return res.json({ active: false, reason: '许可证已过期' });
    }

    res.json({
      active: true,
      type: license.type,
      expiresAt: license.expires_at ? new Date(license.expires_at).toISOString() : null,
    });
  } catch (error) {
    console.error('License status error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// Server-side license verification for Pro feature gating
router.post('/verify-token', async (req, res) => {
  const { licenseCode } = req.body;
  
  if (!licenseCode) {
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }
  
  if (typeof licenseCode !== 'string' || licenseCode.length > 64 || !/^[A-Za-z0-9\-]+$/.test(licenseCode)) {
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT type, expires_at FROM licenses WHERE activation_code = ? AND is_active = TRUE',
      [licenseCode.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.json({ allowed: false, type: 'free', error: '许可证无效' });
    }

    const license = rows[0];
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.json({ allowed: false, type: 'free', error: '许可证已过期' });
    }

    res.json({ allowed: true, type: license.type, remaining: -1 });
  } catch (error) {
    console.error('Verify token error:', error);
    res.json({ allowed: true, type: 'free', remaining: 20, warning: 'server_error' });
  }
});

module.exports = router;
