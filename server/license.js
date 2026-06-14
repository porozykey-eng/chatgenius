// ChatGenius AI Backend - 许可证验证服务
const express = require('express');
const { AV } = require('./config');

const router = express.Router();

// Activate code: atomically validate + mark used + create License
router.post('/activate', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }
  
  // Validate code format: alphanumeric, dashes, max 64 chars
  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  try {
    const normalizedCode = code.toUpperCase();
    
    // Step 1: Query activation code
    const ActivationCode = AV.Object.extend('ActivationCode');
    const query = new AV.Query(ActivationCode);
    query.equalTo('code', normalizedCode);
    const activationCode = await query.first();

    if (!activationCode) {
      return res.json({ valid: false, error: '激活码无效' });
    }

    // Step 2: Check if already used (quick check before atomic update)
    if (activationCode.get('status') === 'used') {
      return res.json({ valid: false, error: '激活码已使用' });
    }

    const licenseType = activationCode.get('type');
    const now = new Date();

    // Step 3: Atomically mark as used with conditional update (prevents race condition)
    activationCode.set('status', 'used');
    activationCode.set('usedAt', now);
    try {
      await activationCode.save(null, {
        fetchWhenSave: true,
        where: { status: { $ne: 'used' } }  // Conditional: only save if not already 'used'
      });
    } catch (saveErr) {
      // LeanCloud returns error code 321 when condition is not met
      if (saveErr.code === 321) {
        return res.json({ valid: false, error: '激活码已使用' });
      }
      throw saveErr;
    }

    // Step 4: Create License record
    const License = AV.Object.extend('License');
    const license = new License();
    license.set('activationCode', normalizedCode);
    license.set('type', licenseType);
    license.set('activatedAt', now);
    license.set('isActive', true);
    
    // Set expiration for yearly licenses
    if (licenseType === 'year') {
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      license.set('expiresAt', expiresAt);
    }
    
    await license.save();

    res.json({
      valid: true,
      type: licenseType,
      activatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Activate error:', error);
    res.status(500).json({ valid: false, error: '激活失败，请重试' });
  }
});

// 验证激活码 (read-only check, does NOT consume the code)
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ valid: false, error: '激活码不能为空' });
  }
  
  // Validate code format: alphanumeric, dashes, max 64 chars
  if (typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ valid: false, error: '激活码格式无效' });
  }

  try {
    const ActivationCode = AV.Object.extend('ActivationCode');
    const query = new AV.Query(ActivationCode);
    query.equalTo('code', code.toUpperCase());
    const activationCode = await query.first();

    if (!activationCode) {
      return res.json({ valid: false, error: '激活码无效' });
    }

    if (activationCode.get('status') === 'used') {
      return res.json({ valid: false, error: '激活码已使用' });
    }

    res.json({
      valid: true,
      type: activationCode.get('type'),
    });
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({ valid: false, error: '验证失败' });
  }
});

// 查询许可证状态
router.get('/status/:code', async (req, res) => {
  const { code } = req.params;
  
  // Validate code format: alphanumeric, dashes, max 64 chars
  if (!code || typeof code !== 'string' || code.length > 64 || !/^[A-Za-z0-9\-]+$/.test(code)) {
    return res.status(400).json({ error: '无效的许可证编码' });
  }
  
  try {
    const License = AV.Object.extend('License');
    const query = new AV.Query(License);
    query.equalTo('activationCode', code);
    query.equalTo('isActive', true);
    const license = await query.first();

    if (!license) {
      return res.json({ active: false });
    }

    const expiresAt = license.get('expiresAt');
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    if (isExpired) {
      return res.json({ active: false, reason: '许可证已过期' });
    }

    res.json({
      active: true,
      type: license.get('type'),
      expiresAt: expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error('License status error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// Server-side license verification for Pro feature gating
// Called by extension before each AI generation to verify license is genuinely active
router.post('/verify-token', async (req, res) => {
  const { licenseCode } = req.body;
  
  if (!licenseCode) {
    // No license code = free user, allow with limit
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }
  
  // Validate code format
  if (typeof licenseCode !== 'string' || licenseCode.length > 64 || !/^[A-Za-z0-9\-]+$/.test(licenseCode)) {
    return res.json({ allowed: true, type: 'free', remaining: 20 });
  }

  try {
    const License = AV.Object.extend('License');
    const query = new AV.Query(License);
    query.equalTo('activationCode', licenseCode.toUpperCase());
    query.equalTo('isActive', true);
    const license = await query.first();

    if (!license) {
      return res.json({ allowed: false, type: 'free', error: '许可证无效' });
    }

    const expiresAt = license.get('expiresAt');
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.json({ allowed: false, type: 'free', error: '许可证已过期' });
    }

    const type = license.get('type');
    // Pro users (lifetime/year) get unlimited access
    res.json({ allowed: true, type: type, remaining: -1 });
  } catch (error) {
    console.error('Verify token error:', error);
    // On server error, allow but log (don't block legitimate users due to server issues)
    res.json({ allowed: true, type: 'free', remaining: 20, warning: 'server_error' });
  }
});

module.exports = router;
