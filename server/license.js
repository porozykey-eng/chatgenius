// ChatGenius AI Backend - 许可证验证服务 (MySQL)
const express = require('express');
const crypto = require('crypto');
const { pool } = require('./config');

const router = express.Router();

// 防刷系统配置
// 注意：客户端密钥已公开，HMAC 签名无实际安全价值，仅保留 timestamp 校验防重放
const LICENSE_HMAC_SECRET = process.env.LICENSE_HMAC_SECRET;
if (!LICENSE_HMAC_SECRET) {
  console.warn('⚠️ LICENSE_HMAC_SECRET 未配置，HMAC 签名校验将被跳过（仅依赖 timestamp 防重放）');
}
const MAX_UNBIND_PER_MONTH = 2;
const MAX_ACTIVATION_ERRORS = 5;
const IP_BAN_HOURS = 24;

// 签名验证：timestamp 5 分钟内有效（防重放）；HMAC 签名校验
function verifySignature(code, timestamp, signature) {
  // H6 修复：客户端 background.js 不生成签名（密钥本就公开），strict 默认 false 保持向后兼容；
  // 要启用严格模式需设 LICENSE_STRICT_SIGNATURE=true 并同步更新客户端生成签名
  const strict = process.env.LICENSE_STRICT_SIGNATURE === 'true';
  const now = Date.now();
  const ts = parseInt(timestamp);
  if (!timestamp || Math.abs(now - ts) > 5 * 60 * 1000) {
    return { valid: false, reason: 'timestamp_expired' };
  }
  if (strict) {
    // strict 模式：signature 必须存在且匹配，否则拒绝（防止不传 signature 绕过校验）
    if (!signature || !LICENSE_HMAC_SECRET) {
      return { valid: false, error: 'missing_signature' };
    }
    const expected = crypto.createHmac('sha256', LICENSE_HMAC_SECRET)
      .update(code + timestamp).digest('hex');
    if (signature !== expected) {
      return { valid: false, error: 'invalid_signature' };
    }
  } else if (signature && LICENSE_HMAC_SECRET) {
    // 非 strict 模式：传了 signature 就校验，不匹配仅告警不拒绝
    const expected = crypto.createHmac('sha256', LICENSE_HMAC_SECRET)
      .update(code + timestamp).digest('hex');
    if (signature !== expected) {
      console.warn('License signature mismatch (non-strict mode)');
      return { valid: true, warning: 'signature_mismatch' };
    }
  }
  return { valid: true };
}

// 检查 IP 是否被封禁
async function checkIpBan(ip) {
  const [rows] = await pool.query(
    'SELECT banned_until FROM ip_bans WHERE ip = ? AND banned_until IS NOT NULL AND banned_until > NOW() ORDER BY id DESC LIMIT 1',
    [ip]
  );
  return rows.length > 0;
}

// 记录激活失败次数，达到阈值则封禁 IP
async function recordActivationError(ip) {
  const [rows] = await pool.query(
    'SELECT id, error_count FROM ip_bans WHERE ip = ? AND DATE(created_at) = CURDATE() ORDER BY id DESC LIMIT 1',
    [ip]
  );
  if (rows.length > 0) {
    const newCount = rows[0].error_count + 1;
    if (newCount >= MAX_ACTIVATION_ERRORS) {
      await pool.query(
        'UPDATE ip_bans SET error_count = ?, banned_until = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE id = ?',
        [newCount, IP_BAN_HOURS, rows[0].id]
      );
      return { banned: true };
    }
    await pool.query('UPDATE ip_bans SET error_count = ? WHERE id = ?', [newCount, rows[0].id]);
  } else {
    await pool.query('INSERT INTO ip_bans (ip, error_count) VALUES (?, 1)', [ip]);
  }
  return { banned: false };
}

// 跨自然月清零 unbind_count，返回当前有效计数
async function checkAndResetUnbindCount(conn, licenseId, resetAt) {
  if (!resetAt) return 0;
  const now = new Date();
  const resetDate = new Date(resetAt);
  if (resetDate.getFullYear() !== now.getFullYear() || resetDate.getMonth() !== now.getMonth()) {
    await conn.query(
      'UPDATE licenses SET unbind_count = 0, unbind_count_reset_at = ? WHERE id = ?',
      [now, licenseId]
    );
    return 0;
  }
  const [rows] = await conn.query('SELECT unbind_count FROM licenses WHERE id = ?', [licenseId]);
  return rows[0] ? rows[0].unbind_count : 0;
}

// 获取客户端 IP
function getClientIp(req) {
  return req.ip || (req.connection && req.connection.remoteAddress) || null;
}

// 激活码：校验签名 + IP 封禁检查 + 指纹绑定
router.post('/activate', async (req, res) => {
  const { code, fingerprint, timestamp, signature } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }

  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  const normalizedCode = code.toUpperCase();
  const ip = getClientIp(req);

  // Step 1: 校验签名
  const sigResult = verifySignature(normalizedCode, timestamp, signature);
  if (!sigResult.valid) {
    return res.status(401).json({ valid: false, error: '签名校验失败', reason: sigResult.reason });
  }

  let conn;
  try {
    // Step 2: 检查 IP 封禁
    if (ip) {
      const banned = await checkIpBan(ip);
      if (banned) {
        return res.status(429).json({ valid: false, error: '请求过于频繁，IP 已被临时封禁' });
      }
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Step 3: 查询激活码（行锁防并发）
    const [rows] = await conn.query(
      'SELECT id, code, type, status, used_at, bound_fingerprint FROM activation_codes WHERE code = ? FOR UPDATE',
      [normalizedCode]
    );

    if (rows.length === 0) {
      await conn.rollback();
      if (ip) await recordActivationError(ip);
      return res.json({ valid: false, error: '激活码无效' });
    }

    const activationCode = rows[0];

    if (activationCode.status === 'used') {
      // 已使用：根据指纹判断是同设备重复激活还是需要换绑
      if (!activationCode.bound_fingerprint) {
        // 老数据没有指纹，直接补绑
        await conn.query(
          'UPDATE activation_codes SET bound_fingerprint = ? WHERE id = ?',
          [fingerprint, activationCode.id]
        );
        // 同步到 license
        await conn.query(
          'UPDATE licenses SET device_fingerprint = ?, unbind_count_reset_at = ? WHERE activation_code = ?',
          [fingerprint, new Date(), normalizedCode]
        );
        await conn.commit();
        return res.json({
          valid: true,
          type: activationCode.type,
          activatedAt: new Date().toISOString(),
        });
      }

      if (activationCode.bound_fingerprint === fingerprint) {
        await conn.rollback();
        return res.json({ valid: false, error: '激活码已使用', alreadyActivated: true });
      }

      // 不同设备：返回需要换绑
      const [licenseRows] = await conn.query(
        'SELECT id, unbind_count, unbind_count_reset_at FROM licenses WHERE activation_code = ?',
        [normalizedCode]
      );
      let remainingCount = MAX_UNBIND_PER_MONTH;
      if (licenseRows.length > 0) {
        const lic = licenseRows[0];
        const currentCount = await checkAndResetUnbindCount(conn, lic.id, lic.unbind_count_reset_at);
        remainingCount = Math.max(0, MAX_UNBIND_PER_MONTH - currentCount);
      }
      await conn.rollback();
      return res.json({
        valid: false,
        error: '激活码已绑定其他设备，请确认换绑',
        needRebind: true,
        remainingCount,
      });
    }

    const licenseType = activationCode.type;
    const now = new Date();

    // Step 4: 标记为已使用 + 写入指纹
    await conn.query(
      'UPDATE activation_codes SET status = ?, used_at = ?, bound_fingerprint = ? WHERE id = ?',
      ['used', now, fingerprint, activationCode.id]
    );

    // Step 5: 创建 License 记录（含设备指纹和清零时间）
    const expiresAt = licenseType === 'year'
      ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      : null;

    await conn.query(
      'INSERT INTO licenses (activation_code, type, activated_at, expires_at, is_active, device_fingerprint, unbind_count, unbind_count_reset_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [normalizedCode, licenseType, new Date(), expiresAt, true, fingerprint, 0, now]
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

// 换绑确认：消耗每月换绑次数，更新绑定指纹
router.post('/rebind', async (req, res) => {
  const { code, fingerprint, timestamp, signature } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }
  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }
  if (!fingerprint) {
    return res.status(400).json({ valid: false, error: '设备指纹不能为空' });
  }

  const normalizedCode = code.toUpperCase();
  const ip = getClientIp(req);

  // Step 1: 校验签名
  const sigResult = verifySignature(normalizedCode, timestamp, signature);
  if (!sigResult.valid) {
    return res.status(401).json({ valid: false, error: '签名校验失败', reason: sigResult.reason });
  }

  let conn;
  try {
    // Step 2: 检查 IP 封禁
    if (ip) {
      const banned = await checkIpBan(ip);
      if (banned) {
        return res.status(429).json({ valid: false, error: '请求过于频繁，IP 已被临时封禁' });
      }
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Step 3: 查询激活码和关联 license
    const [codeRows] = await conn.query(
      'SELECT id, code, type, status, bound_fingerprint FROM activation_codes WHERE code = ? FOR UPDATE',
      [normalizedCode]
    );

    if (codeRows.length === 0) {
      await conn.rollback();
      if (ip) await recordActivationError(ip);
      return res.json({ valid: false, error: '激活码无效' });
    }

    const activationCode = codeRows[0];
    if (activationCode.status !== 'used') {
      await conn.rollback();
      return res.json({ valid: false, error: '激活码尚未激活，无需换绑' });
    }

    const [licenseRows] = await conn.query(
      'SELECT id, type, is_active, expires_at, device_fingerprint, unbind_count, unbind_count_reset_at FROM licenses WHERE activation_code = ? FOR UPDATE',
      [normalizedCode]
    );

    if (licenseRows.length === 0) {
      await conn.rollback();
      return res.json({ valid: false, error: '许可证不存在' });
    }

    const license = licenseRows[0];

    // Step 4: 跨月清零
    const currentCount = await checkAndResetUnbindCount(conn, license.id, license.unbind_count_reset_at);

    // Step 5: 检查本月换绑次数
    if (currentCount >= MAX_UNBIND_PER_MONTH) {
      await conn.rollback();
      return res.json({
        valid: false,
        error: '本月换绑次数已用完',
        remainingCount: 0,
      });
    }

    // 同设备无需换绑
    if (license.device_fingerprint === fingerprint) {
      await conn.rollback();
      return res.json({ valid: false, error: '设备未变化，无需换绑' });
    }

    const now = new Date();

    // Step 6: 更新激活码和 license 的指纹
    await conn.query(
      'UPDATE activation_codes SET bound_fingerprint = ? WHERE id = ?',
      [fingerprint, activationCode.id]
    );

    // Step 7: license.unbind_count +1，更新 reset_at
    await conn.query(
      'UPDATE licenses SET device_fingerprint = ?, unbind_count = ?, unbind_count_reset_at = ?, last_heartbeat = ? WHERE id = ?',
      [fingerprint, currentCount + 1, now, now, license.id]
    );

    await conn.commit();

    res.json({
      valid: true,
      type: license.type,
      activatedAt: now.toISOString(),
      remainingCount: Math.max(0, MAX_UNBIND_PER_MONTH - (currentCount + 1)),
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Rebind error:', error);
    res.status(500).json({ valid: false, error: '换绑失败，请重试' });
  } finally {
    if (conn) conn.release();
  }
});

// 心跳：校验设备绑定状态，更新 last_heartbeat
router.post('/heartbeat', async (req, res) => {
  const { code, fingerprint, timestamp, signature } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, reason: 'missing_code' });
  }
  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, reason: 'invalid_code' });
  }

  const normalizedCode = code.toUpperCase();

  // Step 1: 校验签名
  const sigResult = verifySignature(normalizedCode, timestamp, signature);
  if (!sigResult.valid) {
    return res.status(401).json({ valid: false, reason: sigResult.reason });
  }

  // P1-7 修复：记录心跳 IP，异常多 IP 告警
  const clientIp = req.ip || (req.connection && req.connection.remoteAddress);
  console.log(`License heartbeat: code=${normalizedCode}, ip=${clientIp}, fingerprint=${fingerprint}`);
  // TODO: 可扩展为对比历史 IP，短期内多 IP 切换则告警

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Step 2: 查询 license
    const [rows] = await conn.query(
      'SELECT id, type, is_active, expires_at, device_fingerprint, unbind_count, unbind_count_reset_at FROM licenses WHERE activation_code = ? FOR UPDATE',
      [normalizedCode]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.json({ valid: false, reason: 'not_found' });
    }

    const license = rows[0];

    // Step 3: 检查 license 状态（is_active 标识是否被封禁）
    if (!license.is_active) {
      await conn.rollback();
      return res.json({ valid: false, reason: 'banned' });
    }

    // 过期也视为不可用
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await conn.rollback();
      return res.json({ valid: false, reason: 'banned' });
    }

    // Step 4: 老用户无指纹，自动绑定
    if (!license.device_fingerprint) {
      const now = new Date();
      await conn.query(
        'UPDATE licenses SET device_fingerprint = ?, last_heartbeat = ?, unbind_count_reset_at = ? WHERE id = ?',
        [fingerprint, now, now, license.id]
      );
      // 同步到 activation_codes
      await conn.query(
        'UPDATE activation_codes SET bound_fingerprint = ? WHERE code = ?',
        [fingerprint, normalizedCode]
      );
      await conn.commit();
      return res.json({ valid: true });
    }

    // Step 5: 设备不一致
    if (license.device_fingerprint !== fingerprint) {
      await conn.rollback();
      return res.json({ valid: false, reason: 'device_mismatch' });
    }

    // Step 6: 一致 → 更新心跳，跨月清零
    const now = new Date();
    await checkAndResetUnbindCount(conn, license.id, license.unbind_count_reset_at);
    await conn.query(
      'UPDATE licenses SET last_heartbeat = ? WHERE id = ?',
      [now, license.id]
    );

    await conn.commit();
    res.json({ valid: true });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Heartbeat error:', error);
    res.status(500).json({ valid: false, reason: 'server_error' });
  } finally {
    if (conn) conn.release();
  }
});

// P1-4 修复：/validate 无签名时更严格限流（3 次/分钟），有签名则校验签名
const validateNoSigStore = new Map(); // key: ip -> { count, resetAt }
const VALIDATE_NO_SIG_LIMIT = 3;
const VALIDATE_NO_SIG_WINDOW = 60 * 1000;

// 验证激活码 (read-only check，landing-page 只验证不消耗，不需要指纹)
router.post('/validate', async (req, res) => {
  const { code, timestamp, signature } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }

  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  const normalizedCode = code.toUpperCase();

  // P1-4 修复：信息预言机防护 —— 有签名则校验，无签名则降级为更严格限流（3 次/分钟）
  if (timestamp && signature) {
    const sigResult = verifySignature(normalizedCode, timestamp, signature);
    if (!sigResult.valid) {
      return res.status(401).json({ valid: false, error: '签名校验失败' });
    }
  } else {
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
    const now = Date.now();
    let entry = validateNoSigStore.get(ip);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + VALIDATE_NO_SIG_WINDOW };
      validateNoSigStore.set(ip, entry);
    }
    entry.count++;
    if (entry.count > VALIDATE_NO_SIG_LIMIT) {
      return res.status(429).json({ valid: false, error: '请求过于频繁，请提供签名或稍后再试' });
    }
  }

  try {
    const [rows] = await pool.query(
      'SELECT code, type, status FROM activation_codes WHERE code = ?',
      [normalizedCode]
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
// P1-4 修复：信息最小化，不返回 type/expiresAt 等细节，只返回 valid 布尔值
router.get('/status/:code', async (req, res) => {
  const { code } = req.params;

  if (!code || typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false });
  }

  try {
    const [rows] = await pool.query(
      'SELECT type, expires_at, is_active FROM licenses WHERE activation_code = ? AND is_active = TRUE',
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, active: false });
    }

    const license = rows[0];
    const isExpired = license.expires_at && new Date(license.expires_at) < new Date();

    if (isExpired) {
      return res.json({ valid: false, active: false });
    }

    // 返回兼容前端的字段：active/type 供 background.js 使用，不返回 expiresAt 等敏感细节
    res.json({ valid: true, active: true, type: license.type });
  } catch (error) {
    console.error('License status error:', error);
    res.status(500).json({ valid: false });
  }
});

// Server-side license verification for Pro feature gating
router.post('/verify-token', async (req, res) => {
  const { licenseCode, fingerprint } = req.body;

  if (!licenseCode) {
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }

  if (typeof licenseCode !== 'string' || licenseCode.length > 64 || !/^[A-Za-z0-9\-]+$/.test(licenseCode)) {
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT type, expires_at, device_fingerprint FROM licenses WHERE activation_code = ? AND is_active = TRUE',
      [licenseCode.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.json({ allowed: false, type: 'free', error: '许可证无效' });
    }

    const license = rows[0];
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.json({ allowed: false, type: 'free', error: '许可证已过期' });
    }

    // 可选指纹校验：若提供 fingerprint 且 license 已绑定设备，校验一致性
    if (fingerprint && license.device_fingerprint && license.device_fingerprint !== fingerprint) {
      return res.json({ allowed: false, type: 'free', error: '设备不一致' });
    }

    res.json({ allowed: true, type: license.type, remaining: -1 });
  } catch (error) {
    console.error('Verify token error:', error);
    // P1-6 修复：fail-closed，服务器异常时不放行付费功能
    return res.json({ allowed: false, type: 'free', remaining: 0, error: 'server_error' });
  }
});

module.exports = router;
