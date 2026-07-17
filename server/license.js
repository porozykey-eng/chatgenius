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

// === 设备池配置 ===
const MAX_DEVICES = 2;                  // 一个激活码最多绑定 2 台设备
const MAX_UNBIND_PER_MONTH = 1;         // 每月可踢设备 1 次（收紧，原为 2）
const MAX_ACTIVATION_ERRORS = 5;
const IP_BAN_HOURS = 24;

// === 风控规则配置 ===
const REBIND_SUSPECT_THRESHOLD = 2;     // 24小时内换绑 ≥2 次视为异常
const REBIND_PAUSE_HOURS = 48;          // 异常换绑后暂停换绑 48 小时
const REBIND_REACTIVATE_WARN_MINUTES = 60; // 换绑后 1 小时内原设备再激活 → 告警

// P3-8 修复：日志脱敏工具（激活码/IP/指纹/邮箱）
function maskCode(code) {
  if (!code || typeof code !== 'string') return '***';
  return code.length <= 8 ? '***' : code.substring(0, 4) + '***' + code.slice(-4);
}
function maskIp(ip) {
  if (!ip || typeof ip !== 'string') return 'unknown';
  // IPv4: 保留前 3 段；IPv6: 保留前 2 组
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return parts.length === 4 ? parts.slice(0, 3).join('.') + '.x' : ip;
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 2).join(':') + ':***';
  }
  return 'unknown';
}
function maskFingerprint(fp) {
  if (!fp || typeof fp !== 'string') return '***';
  return fp.length <= 8 ? '***' : fp.substring(0, 8) + '...';
}

// 签名验证：timestamp 5 分钟内有效（防重放）；HMAC 签名校验
function verifySignature(code, timestamp, signature) {
  // strict 模式默认关闭：客户端密钥公开（Chrome 扩展可反编译），HMAC 签名无实际安全价值
  // 防重放由 timestamp 5 分钟窗口保障；如需启用签名校验，设 LICENSE_STRICT_SIGNATURE=true
  const strict = process.env.LICENSE_STRICT_SIGNATURE === 'true';
  const now = Date.now();
  const ts = parseInt(timestamp);
  // timestamp 校验：传了就校验（防重放），没传在非 strict 模式下放行（向后兼容旧客户端）
  if (timestamp) {
    if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
      return { valid: false, reason: 'timestamp_expired' };
    }
  } else if (strict) {
    // strict 模式下 timestamp 必须存在
    return { valid: false, reason: 'missing_timestamp' };
  }
  if (strict) {
    // strict 模式：signature 必须存在且匹配，否则拒绝（防止不传 signature 绕过校验）
    if (!signature || !LICENSE_HMAC_SECRET) {
      return { valid: false, error: 'missing_signature' };
    }
    const expected = crypto.createHmac('sha256', LICENSE_HMAC_SECRET)
      .update(code + timestamp).digest('hex');
    // P1 安全修复：使用 timingSafeEqual 防止时序攻击
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: 'invalid_signature' };
    }
  } else if (signature && LICENSE_HMAC_SECRET) {
    // P2-17 修复：非 strict 模式下传了 signature 就校验，不匹配则拒绝（避免伪造签名通过）
    const expected = crypto.createHmac('sha256', LICENSE_HMAC_SECRET)
      .update(code + timestamp).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn('License signature mismatch (non-strict mode)');
      return { valid: false, error: 'invalid_signature' };
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
// P0-3 修复：改用原子 upsert（INSERT ... ON DUPLICATE KEY UPDATE），避免先 SELECT 后 UPDATE 的并发竞态
// 依赖迁移脚本 add-license-security-fixes.js 为 ip_bans.ip 添加的唯一索引
async function recordActivationError(ip) {
  try {
    // 原子递增：INSERT ON DUPLICATE KEY UPDATE
    await pool.query(
      'INSERT INTO ip_bans (ip, error_count, last_error_at) VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE error_count = error_count + 1, last_error_at = NOW()',
      [ip]
    );
    // 检查是否达到阈值，触发封禁
    const [rows] = await pool.query(
      'SELECT error_count FROM ip_bans WHERE ip = ? AND DATE(created_at) = CURDATE() ORDER BY id DESC LIMIT 1',
      [ip]
    );
    if (rows.length > 0 && rows[0].error_count >= MAX_ACTIVATION_ERRORS) {
      await pool.query(
        'UPDATE ip_bans SET banned_until = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE ip = ? AND banned_until IS NULL',
        [IP_BAN_HOURS, ip]
      );
    }
  } catch (err) {
    console.error('Record activation error failed:', err.message);
  }
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

// === 风控：检查换绑是否被暂停 ===
async function checkRebindPaused(conn, licenseId) {
  const [rows] = await conn.query(
    'SELECT rebind_paused_until FROM licenses WHERE id = ?', [licenseId]
  );
  if (rows.length > 0 && rows[0].rebind_paused_until) {
    const until = new Date(rows[0].rebind_paused_until);
    if (until > new Date()) {
      return { paused: true, until };
    }
  }
  return { paused: false };
}

// === 风控：记录换绑时间，检测异常频率 ===
// 24 小时内换绑 ≥2 次 → 暂停换绑 REBIND_PAUSE_HOURS 小时
// P0 修复：原逻辑用 unbind_count（月度计数）判断，但 MAX_UNBIND_PER_MONTH=1 导致永远无法达到阈值 2
// 改为用 last_rebind_at 的时间窗口判断：如果上次换绑在 24 小时内，说明 24h 内已≥2 次换绑
async function recordRebindAndCheckRisk(conn, licenseId) {
  const now = new Date();
  const [rows] = await conn.query(
    'SELECT last_rebind_at FROM licenses WHERE id = ?', [licenseId]
  );
  if (rows.length === 0) return { suspect: false };
  const lic = rows[0];

  // 如果上次换绑在 24 小时内，触发暂停
  if (lic.last_rebind_at) {
    const lastRebind = new Date(lic.last_rebind_at);
    const hoursSinceLastRebind = (now - lastRebind) / (3600 * 1000);
    if (hoursSinceLastRebind < 24) {
      const pauseUntil = new Date(now.getTime() + REBIND_PAUSE_HOURS * 3600 * 1000);
      await conn.query(
        'UPDATE licenses SET rebind_paused_until = ?, last_rebind_at = ? WHERE id = ?',
        [pauseUntil, now, licenseId]
      );
      console.warn(`⚠️ 风控告警：license_id=${licenseId} 24小时内多次换绑（距上次${hoursSinceLastRebind.toFixed(1)}h），暂停至 ${pauseUntil.toISOString()}`);
      return { suspect: true, pauseUntil };
    }
  }

  // 记录本次换绑时间
  await conn.query(
    'UPDATE licenses SET last_rebind_at = ? WHERE id = ?', [now, licenseId]
  );
  return { suspect: false };
}

// === 风控：换绑后短时间内原设备再激活告警 ===
async function checkRebindReactivateWarn(conn, licenseId, oldFingerprint) {
  const [rows] = await conn.query(
    'SELECT last_rebind_at FROM licenses WHERE id = ?', [licenseId]
  );
  if (rows.length === 0 || !rows[0].last_rebind_at) return;
  const lastRebind = new Date(rows[0].last_rebind_at);
  const elapsedMin = (Date.now() - lastRebind.getTime()) / 60000;
  if (elapsedMin < REBIND_REACTIVATE_WARN_MINUTES) {
    console.warn(`⚠️ 风控告警：license_id=${licenseId} 换绑后 ${Math.round(elapsedMin)} 分钟，原设备 ${oldFingerprint.substring(0, 8)}... 再次激活，疑似共享`);
  }
}

// === 设备池：获取活跃设备列表 ===
async function getActiveDevices(conn, licenseId) {
  const [rows] = await conn.query(
    'SELECT id, device_fingerprint, device_name, first_seen_at, last_heartbeat_at, last_ip, is_active FROM license_devices WHERE license_id = ? AND is_active = 1 ORDER BY first_seen_at ASC',
    [licenseId]
  );
  return rows;
}

// === 设备池：添加设备（返回是否成功）===
async function addDevice(conn, licenseId, activationCode, fingerprint, ip, deviceName) {
  // 检查是否已存在（含已踢的）
  const [existing] = await conn.query(
    'SELECT id, is_active FROM license_devices WHERE license_id = ? AND device_fingerprint = ?',
    [licenseId, fingerprint]
  );
  if (existing.length > 0) {
    if (!existing[0].is_active) {
      // 之前被踢过，重新激活
      await conn.query(
        'UPDATE license_devices SET is_active = 1, first_seen_at = ?, last_heartbeat_at = ?, last_ip = ? WHERE id = ?',
        [new Date(), new Date(), ip, existing[0].id]
      );
    }
    return { added: false, reactivated: true };
  }
  await conn.query(
    'INSERT INTO license_devices (license_id, activation_code, device_fingerprint, device_name, first_seen_at, last_heartbeat_at, last_ip, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [licenseId, activationCode, fingerprint, deviceName || null, new Date(), new Date(), ip]
  );
  return { added: true };
}

// === 设备池：踢设备 ===
async function deactivateDevice(conn, deviceId, licenseId) {
  const [result] = await conn.query(
    'UPDATE license_devices SET is_active = 0 WHERE id = ? AND license_id = ?',
    [deviceId, licenseId]
  );
  return result.affectedRows > 0;
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
      // 已使用：进入设备池模式
      const [licenseRows] = await conn.query(
        'SELECT id, type, is_active, expires_at, device_fingerprint, unbind_count, unbind_count_reset_at FROM licenses WHERE activation_code = ? FOR UPDATE',
        [normalizedCode]
      );

      if (licenseRows.length === 0) {
        // P2-20 修复：激活码已 used 但无 license 记录（异常数据），创建缺失的 license 记录和设备池记录
        const expiresAt = activationCode.type === 'year'
          ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          : null;
        const now = new Date();
        const [licenseResult] = await conn.query(
          'INSERT INTO licenses (activation_code, type, activated_at, expires_at, is_active, device_fingerprint, unbind_count, unbind_count_reset_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [normalizedCode, activationCode.type, now, expiresAt, true, fingerprint, 0, now]
        );
        await conn.query(
          'UPDATE activation_codes SET bound_fingerprint = ? WHERE id = ?',
          [fingerprint, activationCode.id]
        );
        const deviceName = req.body.deviceName || req.headers['user-agent']?.substring(0, 200) || null;
        await addDevice(conn, licenseResult.insertId, normalizedCode, fingerprint, ip, deviceName);
        await conn.commit();
        return res.json({ valid: true, type: activationCode.type, activatedAt: now.toISOString() });
      }

      const license = licenseRows[0];

      // 检查设备池中是否已有此设备
      const [deviceRows] = await conn.query(
        'SELECT id, is_active FROM license_devices WHERE license_id = ? AND device_fingerprint = ?',
        [license.id, fingerprint]
      );

      if (deviceRows.length > 0 && deviceRows[0].is_active) {
        // 同设备重复激活
        await conn.rollback();
        return res.json({ valid: false, error: '激活码已使用', alreadyActivated: true });
      }

      // 查询当前活跃设备数
      const devices = await getActiveDevices(conn, license.id);

      if (devices.length < MAX_DEVICES) {
        // 设备池未满，直接添加新设备（不消耗换绑次数）
        const deviceName = req.body.deviceName || req.headers['user-agent']?.substring(0, 200) || null;
        await addDevice(conn, license.id, normalizedCode, fingerprint, ip, deviceName);

        // 更新 bound_fingerprint 为最新设备
        await conn.query(
          'UPDATE activation_codes SET bound_fingerprint = ? WHERE id = ?',
          [fingerprint, activationCode.id]
        );
        await conn.query(
          'UPDATE licenses SET device_fingerprint = ?, last_heartbeat = ? WHERE id = ?',
          [fingerprint, new Date(), license.id]
        );

        await conn.commit();
        return res.json({
          valid: true,
          type: license.type,
          activatedAt: new Date().toISOString(),
          deviceCount: devices.length + 1,
          maxDevices: MAX_DEVICES,
        });
      }

      // 设备池已满：检查风控 → 返回需要换绑
      const pauseCheck = await checkRebindPaused(conn, license.id);
      if (pauseCheck.paused) {
        await conn.rollback();
        return res.json({
          valid: false,
          error: `换绑功能已暂停，请于 ${pauseCheck.until.toISOString().slice(0, 16).replace('T', ' ')} 后再试`,
          rebindPaused: true,
        });
      }

      const currentCount = await checkAndResetUnbindCount(conn, license.id, license.unbind_count_reset_at);
      const remainingCount = Math.max(0, MAX_UNBIND_PER_MONTH - currentCount);

      await conn.rollback();
      return res.json({
        valid: false,
        error: `已绑定 ${MAX_DEVICES} 台设备，请先解绑一台旧设备`,
        needRebind: true,
        remainingCount,
        maxDevices: MAX_DEVICES,
        currentDevices: devices.map(d => ({
          id: d.id,
          fingerprint: d.device_fingerprint.substring(0, 8) + '...',
          name: d.device_name,
          lastSeen: d.last_heartbeat_at,
        })),
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

    const [licenseResult] = await conn.query(
      'INSERT INTO licenses (activation_code, type, activated_at, expires_at, is_active, device_fingerprint, unbind_count, unbind_count_reset_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [normalizedCode, licenseType, new Date(), expiresAt, true, fingerprint, 0, now]
    );

    // Step 6: 同步插入 license_devices 设备池
    const deviceName = req.body.deviceName || req.headers['user-agent']?.substring(0, 200) || null;
    await conn.query(
      'INSERT INTO license_devices (license_id, activation_code, device_fingerprint, device_name, first_seen_at, last_heartbeat_at, last_ip, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [licenseResult.insertId, normalizedCode, fingerprint, deviceName, now, now, ip]
    );

    await conn.commit();

    res.json({
      valid: true,
      type: licenseType,
      activatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Activate error:', error.message);
    res.status(500).json({ valid: false, error: '激活失败，请重试' });
  } finally {
    if (conn) conn.release();
  }
});

// 换绑确认：踢掉一台旧设备 + 添加新设备（消耗每月换绑次数）
// 请求体需指定 unbindDeviceId（要踢的旧设备 ID）
router.post('/rebind', async (req, res) => {
  const { code, fingerprint, timestamp, signature, unbindDeviceId } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }
  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }
  if (!fingerprint) {
    return res.status(400).json({ valid: false, error: '设备指纹不能为空' });
  }
  if (!unbindDeviceId) {
    return res.status(400).json({ valid: false, error: '请指定要解绑的设备' });
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

    // Step 4: 风控检查 — 换绑是否被暂停
    const pauseCheck = await checkRebindPaused(conn, license.id);
    if (pauseCheck.paused) {
      await conn.rollback();
      return res.json({
        valid: false,
        error: `换绑功能已暂停，请于 ${pauseCheck.until.toISOString().slice(0, 16).replace('T', ' ')} 后再试`,
        rebindPaused: true,
      });
    }

    // Step 5: 跨月清零
    const currentCount = await checkAndResetUnbindCount(conn, license.id, license.unbind_count_reset_at);

    // Step 6: 检查本月换绑次数
    if (currentCount >= MAX_UNBIND_PER_MONTH) {
      await conn.rollback();
      return res.json({
        valid: false,
        error: '本月换绑次数已用完',
        remainingCount: 0,
      });
    }

    // Step 7: 踢掉旧设备
    const oldFingerprint = license.device_fingerprint;
    const kicked = await deactivateDevice(conn, parseInt(unbindDeviceId), license.id);
    if (!kicked) {
      await conn.rollback();
      return res.json({ valid: false, error: '未找到要解绑的设备' });
    }

    const now = new Date();
    const deviceName = req.body.deviceName || req.headers['user-agent']?.substring(0, 200) || null;

    // Step 8: 添加新设备
    await addDevice(conn, license.id, normalizedCode, fingerprint, ip, deviceName);

    // Step 9: 更新 bound_fingerprint + unbind_count
    await conn.query(
      'UPDATE activation_codes SET bound_fingerprint = ? WHERE id = ?',
      [fingerprint, activationCode.id]
    );
    await conn.query(
      'UPDATE licenses SET device_fingerprint = ?, unbind_count = ?, unbind_count_reset_at = ?, last_heartbeat = ? WHERE id = ?',
      [fingerprint, currentCount + 1, now, now, license.id]
    );

    // Step 10: 风控 — 记录换绑时间 + 检测异常频率（必须在 unbind_count 递增之后）
    await recordRebindAndCheckRisk(conn, license.id);

    // 风控 — 检查原设备是否短时间内再激活（仅告警，在 commit 前执行）
    if (oldFingerprint) {
      await checkRebindReactivateWarn(conn, license.id, oldFingerprint).catch(() => {});
    }

    await conn.commit();

    res.json({
      valid: true,
      type: license.type,
      activatedAt: now.toISOString(),
      remainingCount: Math.max(0, MAX_UNBIND_PER_MONTH - (currentCount + 1)),
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Rebind error:', error.message);
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
  // P3-8 修复：日志脱敏（激活码/IP/指纹）
  console.log(`License heartbeat: code=${maskCode(normalizedCode)}, ip=${maskIp(clientIp)}, fingerprint=${maskFingerprint(fingerprint)}`);

  // P1 安全修复：心跳接口也检查 IP 封禁
  if (clientIp) {
    const isBanned = await checkIpBan(clientIp);
    if (isBanned) {
      return res.status(403).json({ valid: false, reason: 'ip_banned' });
    }
  }

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

    // Step 4: 老用户无指纹，自动绑定到设备池
    if (!license.device_fingerprint) {
      const now = new Date();
      await conn.query(
        'UPDATE licenses SET device_fingerprint = ?, last_heartbeat = ?, unbind_count_reset_at = ? WHERE id = ?',
        [fingerprint, now, now, license.id]
      );
      await conn.query(
        'UPDATE activation_codes SET bound_fingerprint = ? WHERE code = ?',
        [fingerprint, normalizedCode]
      );
      // 同步到设备池
      await addDevice(conn, license.id, normalizedCode, fingerprint, clientIp, null);
      await conn.commit();
      return res.json({ valid: true });
    }

    // Step 5: 检查设备是否在活跃设备池中
    const [deviceRows] = await conn.query(
      'SELECT id, is_active, last_ip FROM license_devices WHERE license_id = ? AND device_fingerprint = ?',
      [license.id, fingerprint]
    );

    if (deviceRows.length === 0 || !deviceRows[0].is_active) {
      // 设备不在池中或已被踢
      await conn.rollback();
      return res.json({ valid: false, reason: 'device_mismatch' });
    }

    // Step 6: 设备在池中 → 更新心跳 + 跨月清零
    const now = new Date();
    await checkAndResetUnbindCount(conn, license.id, license.unbind_count_reset_at);
    await conn.query(
      'UPDATE licenses SET last_heartbeat = ? WHERE id = ?',
      [now, license.id]
    );
    // 更新设备池中的心跳时间和 IP
    await conn.query(
      'UPDATE license_devices SET last_heartbeat_at = ?, last_ip = ? WHERE id = ?',
      [now, clientIp, deviceRows[0].id]
    );

    // Step 7: P0 风控 — IP 跨地区告警
    // 如果当前设备上次心跳 IP 与本次不同，记录告警
    if (deviceRows[0].last_ip && deviceRows[0].last_ip !== clientIp) {
      // P3-8 修复：日志脱敏 IP
      console.warn(`⚠️ 风控告警：license_id=${license.id} 设备IP变更 ${maskIp(deviceRows[0].last_ip)} → ${maskIp(clientIp)}，可能存在跨地区使用`);
    }

    // Step 8: P0 风控 — 同时≥2台设备心跳时踢掉最老设备
    // P1-8 修复：排除当前设备，避免踢掉正在心跳的设备
    const [currentDevice] = await conn.query(
      'SELECT id FROM license_devices WHERE license_id = ? AND device_fingerprint = ? AND is_active = 1',
      [license.id, fingerprint]
    );
    const currentDeviceId = currentDevice.length > 0 ? currentDevice[0].id : 0;

    // 查询其他活跃设备中近 5 分钟内心跳过的（说明同时在线），排除当前设备
    const [otherActiveDevices] = await conn.query(
      `SELECT id, device_fingerprint, first_seen_at, last_heartbeat_at
       FROM license_devices
       WHERE license_id = ? AND is_active = 1 AND id != ? AND last_heartbeat_at > DATE_SUB(?, INTERVAL 5 MINUTE)
       ORDER BY first_seen_at ASC`,
      [license.id, currentDeviceId, now]
    );

    if (otherActiveDevices.length >= MAX_DEVICES) {
      // 踢掉最老的其他设备（first_seen_at 最早的），保留当前设备
      const oldestDevice = otherActiveDevices[0];
      await conn.query('UPDATE license_devices SET is_active = 0 WHERE id = ?', [oldestDevice.id]);
      console.warn(`⚠️ 风控告警：license_id=${license.id} 检测到${otherActiveDevices.length + 1}台设备同时心跳，已踢掉最老设备`);
    }

    await conn.commit();
    res.json({ valid: true });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Heartbeat error:', error.message);
    res.status(500).json({ valid: false, reason: 'server_error' });
  } finally {
    if (conn) conn.release();
  }
});

// P1-4 修复：/validate 无签名时更严格限流（3 次/分钟），有签名则校验签名
const validateNoSigStore = new Map(); // key: ip -> { count, resetAt }
const VALIDATE_NO_SIG_LIMIT = 3;
const VALIDATE_NO_SIG_WINDOW = 60 * 1000; // 1 分钟窗口
// P2-19 修复：LRU 上限，防止海量 IP 攻击撑大内存
const VALIDATE_NOSIG_MAX_SIZE = 10000;

// P2-19 修复：定时清理过期条目，防止 Map 无限增长
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of validateNoSigStore) {
    if (now - record.resetAt > VALIDATE_NO_SIG_WINDOW) {
      validateNoSigStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// 验证激活码 (read-only check，landing-page 只验证不消耗，不需要指纹)
router.post('/validate', async (req, res) => {
  const { code, timestamp, signature } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }

  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  // P1 安全修复：检查 IP 是否被封禁
  const clientIp = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  if (clientIp !== 'unknown') {
    const isBanned = await checkIpBan(clientIp);
    if (isBanned) {
      return res.status(403).json({ valid: false, error: 'IP 已被封禁，请稍后再试' });
    }
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
      // P2-19 修复：LRU 保护，超过上限时删除最旧条目
      if (validateNoSigStore.size >= VALIDATE_NOSIG_MAX_SIZE) {
        const oldestKey = validateNoSigStore.keys().next().value;
        validateNoSigStore.delete(oldestKey);
      }
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
    console.error('Validate error:', error.message);
    res.status(500).json({ valid: false, error: '验证失败' });
  }
});

// 查询当前激活码绑定的设备列表
router.post('/devices', async (req, res) => {
  const { code, fingerprint, timestamp, signature } = req.body;

  if (!code || typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  const normalizedCode = code.toUpperCase();

  // 签名校验
  const sigResult = verifySignature(normalizedCode, timestamp, signature);
  if (!sigResult.valid) {
    return res.status(401).json({ valid: false, error: '签名校验失败' });
  }

  try {
    const [licenseRows] = await pool.query(
      'SELECT id, type, unbind_count, unbind_count_reset_at, rebind_paused_until FROM licenses WHERE activation_code = ? AND is_active = TRUE',
      [normalizedCode]
    );

    if (licenseRows.length === 0) {
      return res.json({ valid: false, error: '许可证不存在或已失效' });
    }

    const license = licenseRows[0];
    const currentCount = await checkAndResetUnbindCount(pool, license.id, license.unbind_count_reset_at);

    const [devices] = await pool.query(
      'SELECT id, device_fingerprint, device_name, first_seen_at, last_heartbeat_at, last_ip, is_active FROM license_devices WHERE license_id = ? ORDER BY is_active DESC, first_seen_at ASC',
      [license.id]
    );

    // 判断换绑是否暂停
    let rebindPaused = false;
    if (license.rebind_paused_until && new Date(license.rebind_paused_until) > new Date()) {
      rebindPaused = true;
    }

    res.json({
      valid: true,
      maxDevices: MAX_DEVICES,
      remainingRebind: Math.max(0, MAX_UNBIND_PER_MONTH - currentCount),
      rebindPaused,
      devices: devices.map(d => ({
        id: d.id,
        fingerprint: d.device_fingerprint.substring(0, 8) + '...',
        name: d.device_name,
        firstSeen: d.first_seen_at,
        lastSeen: d.last_heartbeat_at,
        lastIp: d.last_ip,
        isActive: !!d.is_active,
        isCurrent: d.device_fingerprint === fingerprint,
      })),
    });
  } catch (error) {
    console.error('Devices list error:', error.message);
    res.status(500).json({ valid: false, error: '查询失败' });
  }
});

// 踢设备（用户主动解绑某台设备，不消耗换绑次数，仅腾出设备池名额）
router.post('/devices/unbind', async (req, res) => {
  const { code, fingerprint, timestamp, signature, deviceId } = req.body;

  if (!code || typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }
  if (!deviceId) {
    return res.status(400).json({ valid: false, error: '缺少设备 ID' });
  }

  const normalizedCode = code.toUpperCase();

  const sigResult = verifySignature(normalizedCode, timestamp, signature);
  if (!sigResult.valid) {
    return res.status(401).json({ valid: false, error: '签名校验失败' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [licenseRows] = await conn.query(
      'SELECT id, device_fingerprint FROM licenses WHERE activation_code = ? AND is_active = TRUE FOR UPDATE',
      [normalizedCode]
    );

    if (licenseRows.length === 0) {
      await conn.rollback();
      return res.json({ valid: false, error: '许可证不存在' });
    }

    const license = licenseRows[0];

    // 不能踢当前设备
    const [targetDevice] = await conn.query(
      'SELECT id, device_fingerprint, is_active FROM license_devices WHERE id = ? AND license_id = ?',
      [parseInt(deviceId), license.id]
    );

    if (targetDevice.length === 0) {
      await conn.rollback();
      return res.json({ valid: false, error: '设备不存在' });
    }

    if (targetDevice[0].device_fingerprint === fingerprint) {
      await conn.rollback();
      return res.json({ valid: false, error: '不能解绑当前正在使用的设备' });
    }

    if (!targetDevice[0].is_active) {
      await conn.rollback();
      return res.json({ valid: false, error: '该设备已解绑' });
    }

    await deactivateDevice(conn, parseInt(deviceId), license.id);

    await conn.commit();
    res.json({ valid: true, message: '设备已解绑' });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Device unbind error:', error.message);
    res.status(500).json({ valid: false, error: '解绑失败' });
  } finally {
    if (conn) conn.release();
  }
});

// 查询许可证状态（POST：推荐方式，激活码放在 body 中，避免被 morgan 日志记录）
// P1-3 修复：新增 POST /status，激活码不再暴露在 URL 路径；同时增加 verifySignature 校验
router.post('/status', async (req, res) => {
  const { code, timestamp, signature } = req.body;

  if (!code || typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false });
  }

  const normalizedCode = code.toUpperCase();

  // 签名校验（与其他接口一致）
  const sigResult = verifySignature(normalizedCode, timestamp, signature);
  if (!sigResult.valid) {
    return res.status(401).json({ valid: false, error: '签名校验失败' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT type, expires_at, is_active FROM licenses WHERE activation_code = ? AND is_active = TRUE',
      [normalizedCode]
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
    console.error('License status error:', error.message);
    res.status(500).json({ valid: false });
  }
});

// 查询许可证状态（GET：已废弃，向后兼容保留；激活码暴露在 URL 会被 morgan 记录，后续客户端将切换为 POST）
// P1-2 修复：注释与实现一致——本接口会返回 type 字段，供 background.js 区分 free/pro
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
    console.error('License status error:', error.message);
    res.status(500).json({ valid: false });
  }
});

// Server-side license verification for Pro feature gating
// 设备池模式：校验设备是否在 license_devices 活跃列表中
router.post('/verify-token', async (req, res) => {
  const { licenseCode, fingerprint, timestamp, signature } = req.body;

  if (!licenseCode) {
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }

  if (typeof licenseCode !== 'string' || licenseCode.length > 64 || !/^[A-Za-z0-9\-]+$/.test(licenseCode)) {
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }

  const normalizedCode = licenseCode.toUpperCase();

  // P0-1 修复：强制要求 fingerprint，缺失直接拒绝（fail-closed），避免不传 fingerprint 绕过设备绑定校验
  if (!fingerprint || typeof fingerprint !== 'string') {
    return res.status(400).json({ allowed: false, type: 'free', error: 'missing_fingerprint' });
  }

  // P0-1 修复：增加 verifySignature 校验（与其他接口一致），校验 timestamp + signature
  const sigResult = verifySignature(normalizedCode, timestamp, signature);
  if (!sigResult.valid) {
    return res.status(401).json({ allowed: false, type: 'free', error: '签名校验失败', reason: sigResult.reason });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT id, type, expires_at, is_active, device_fingerprint FROM licenses WHERE activation_code = ? FOR UPDATE',
      [normalizedCode]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.json({ allowed: false, type: 'free', error: '许可证无效' });
    }

    const license = rows[0];

    if (!license.is_active) {
      await conn.rollback();
      return res.json({ allowed: false, type: 'free', error: '许可证已被禁用' });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await conn.rollback();
      return res.json({ allowed: false, type: 'free', error: '许可证已过期' });
    }

    // 设备池校验：fingerprint 必须命中活跃设备列表（fail-closed，不再可选）
    // 老用户尚未迁移到设备池：自动补录到设备池（宽松策略，避免误伤已激活用户）
    if (!license.device_fingerprint) {
      // P2-18 修复：自动补录前检查设备池上限，避免超过 MAX_DEVICES
      const devices = await getActiveDevices(conn, license.id);
      if (devices.length >= MAX_DEVICES) {
        await conn.rollback();
        return res.json({ allowed: false, reason: 'device_limit_exceeded' });
      }
      await conn.query(
        'UPDATE licenses SET device_fingerprint = ? WHERE id = ?',
        [fingerprint, license.id]
      );
      await addDevice(conn, license.id, normalizedCode, fingerprint, getClientIp(req), null);
      await conn.commit();
      return res.json({ allowed: true, type: license.type, remaining: -1 });
    }

    const [deviceRows] = await conn.query(
      'SELECT id, is_active FROM license_devices WHERE license_id = ? AND device_fingerprint = ?',
      [license.id, fingerprint]
    );

    if (deviceRows.length === 0 || !deviceRows[0].is_active) {
      await conn.rollback();
      return res.json({ allowed: false, type: 'free', error: '设备不在授权列表' });
    }

    await conn.commit();
    res.json({ allowed: true, type: license.type, remaining: -1 });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Verify token error:', error.message);
    // P1-6 修复：fail-closed，服务器异常时不放行付费功能
    return res.json({ allowed: false, type: 'free', remaining: 0, error: 'server_error' });
  } finally {
    if (conn) conn.release();
  }
});

// 续费预校验:验证激活码可续费并返回信息
router.post('/lookup-renewal', async (req, res) => {
  const { code } = req.body;
  if (!code || !/^[A-Za-z0-9\-]{1,64}$/.test(code)) {
    return res.json({ canRenew: false, error: '激活码格式无效' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT type, is_active, expires_at, user_email FROM licenses WHERE activation_code = ?',
      [code.toUpperCase()]
    );
    if (rows.length === 0) return res.json({ canRenew: false, error: '激活码不存在' });
    const lic = rows[0];
    if (lic.type !== 'year') return res.json({ canRenew: false, error: '永久版无需续费' });
    if (!lic.is_active) return res.json({ canRenew: false, error: '许可证已撤销,请联系客服' });

    const now = new Date();
    const exp = lic.expires_at ? new Date(lic.expires_at) : null;
    // 允许过期 30 天内续费
    if (exp && exp < now) {
      const daysOverdue = Math.floor((now - exp) / 86400000);
      if (daysOverdue > 30) {
        return res.json({ canRenew: false, error: '许可证已过期超过 30 天,请联系客服续费' });
      }
    }

    // 预测续费后到期时间
    const base = (exp && exp > now) ? exp : now;
    const newExpiry = new Date(base);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    res.json({
      canRenew: true,
      expiresAt: exp ? exp.toLocaleDateString('zh-CN') : null,
      newExpiresAt: newExpiry.toLocaleDateString('zh-CN'),
      price: Number(process.env.PRICE_YEAR || 68),
      hasEmail: !!lic.user_email
    });
  } catch (err) {
    console.error('Lookup renewal error:', err.message);
    res.status(500).json({ canRenew: false, error: '服务器错误' });
  }
});

module.exports = router;
