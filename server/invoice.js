// ChatGenius - 发票申请 API（用户端）
const express = require('express');
const rateLimit = require('express-rate-limit');
const { pool } = require('./config');

const router = express.Router();

// 限流：每分钟 5 次
const invoiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});

// P3-8 修复：邮箱脱敏
function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '***';
  const [name, domain] = email.split('@');
  return (name.length <= 2 ? name[0] + '*' : name.substring(0, 2) + '***') + '@' + domain;
}

// 邮箱格式校验
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 纳税人识别号校验（18位统一社会信用代码或15位/20位税号）
function isValidTaxNumber(tax) {
  return /^[A-Z0-9]{15,20}$/.test(tax);
}

// POST /api/invoice/submit - 提交发票申请
router.post('/submit', invoiceLimiter, async (req, res) => {
  const { orderNo, invoiceType, title, taxNumber, email, licenseCode } = req.body;

  // 参数校验
  if (!orderNo || !invoiceType || !title || !email) {
    return res.status(400).json({ success: false, error: '请填写完整信息' });
  }

  // P1 修复：orderNo 格式白名单校验，防止注入和无效查询
  if (!/^[A-Za-z0-9\-]{1,64}$/.test(orderNo)) {
    return res.status(400).json({ success: false, error: '订单号格式无效' });
  }

  if (!['personal', 'company'].includes(invoiceType)) {
    return res.status(400).json({ success: false, error: '发票类型无效' });
  }

  if (title.length > 200) {
    return res.status(400).json({ success: false, error: '发票抬头过长' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: '邮箱格式不正确' });
  }

  // 企业发票必须有税号
  if (invoiceType === 'company') {
    if (!taxNumber) {
      return res.status(400).json({ success: false, error: '企业发票必须填写纳税人识别号' });
    }
    if (!isValidTaxNumber(taxNumber)) {
      return res.status(400).json({ success: false, error: '纳税人识别号格式不正确（15-20位字母或数字）' });
    }
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    // 验证订单存在且已完成（行锁，防并发）
    const [orders] = await conn.query(
      'SELECT order_no, price, status, activation_code, type FROM orders WHERE order_no = ? FOR UPDATE',
      [orderNo]
    );

    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orders[0];
    if (order.status !== 'completed') {
      await conn.rollback();
      return res.status(400).json({ success: false, error: '订单未完成，无法申请发票' });
    }

    // P1-2 修复：校验订单归属（激活码必须属于此订单，通过 orders.activation_code 关联）
    // C2 修复：在线支付自动完成的订单 activation_code 可能为 NULL，需反查 licenses 表
    if (!licenseCode) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: '请提供激活码以验证订单归属' });
    }
    if (order.activation_code) {
      // 有 activation_code：直接比对
      if (String(order.activation_code).toUpperCase() !== String(licenseCode).toUpperCase()) {
        await conn.rollback();
        return res.status(403).json({ success: false, error: '激活码与订单不匹配' });
      }
    } else {
      // 无 activation_code（在线支付自动完成的订单）：反查 licenses 表
      const [licenseRows] = await conn.query(
        'SELECT id FROM licenses WHERE activation_code = ? AND type = ?',
        [String(licenseCode).toUpperCase(), order.type]
      );
      if (licenseRows.length === 0) {
        await conn.rollback();
        return res.status(403).json({ success: false, error: '激活码与订单不匹配' });
      }
    }

    // 检查是否已有发票申请（pending 或 issued 状态不可重复申请，行锁防并发重复提交）
    const [existing] = await conn.query(
      'SELECT id, status FROM invoice_requests WHERE order_no = ? AND status IN (?, ?) FOR UPDATE',
      [orderNo, 'pending', 'issued']
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        error: '该订单已提交过发票申请，请勿重复提交',
      });
    }

    // 创建发票申请
    await conn.query(
      `INSERT INTO invoice_requests (order_no, invoice_type, title, tax_number, email, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [orderNo, invoiceType, title, taxNumber || null, email, order.price]
    );

    await conn.commit();
    console.log(`✅ 发票申请已创建: order=${orderNo}, type=${invoiceType}, email=${maskEmail(email)}`);

    res.json({
      success: true,
      message: '发票申请已提交，我们将在 1-3 个工作日内处理',
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Submit invoice error:', err);
    res.status(500).json({ success: false, error: '提交失败，请稍后重试' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/invoice/status/:orderNo - 查询订单的发票状态
router.get('/status/:orderNo', async (req, res) => {
  const { orderNo } = req.params;

  // P1 修复：orderNo 格式白名单校验
  if (!/^[A-Za-z0-9\-]{1,64}$/.test(orderNo)) {
    return res.status(400).json({ exists: false, error: '订单号格式无效' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT status, invoice_url, created_at, issued_at FROM invoice_requests WHERE order_no = ? ORDER BY created_at DESC LIMIT 1',
      [orderNo]
    );

    if (rows.length === 0) {
      return res.json({ exists: false });
    }

    const inv = rows[0];
    res.json({
      exists: true,
      status: inv.status,
      invoiceUrl: inv.invoice_url,
      createdAt: inv.created_at,
      issuedAt: inv.issued_at,
    });
  } catch (err) {
    console.error('Get invoice status error:', err);
    res.status(500).json({ exists: false, error: '查询失败' });
  }
});

module.exports = router;
