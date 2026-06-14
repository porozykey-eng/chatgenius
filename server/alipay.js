// ChatGenius AI Backend - 支付宝支付服务
const express = require('express');
const AlipaySDK = require('alipay-sdk').default;
const { AV } = require('./config');

const router = express.Router();

// 初始化支付宝 SDK
const alipaySdk = new AlipaySDK({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
});

// 创建预支付订单（当面付 - 生成二维码）
router.post('/create-order', async (req, res) => {
  const { orderNo, amount, subject } = req.body;
  
  if (!orderNo || !amount || !subject) {
    return res.status(400).json({ success: false, error: '参数不完整' });
  }
  
  // Validate amount is a positive number within reasonable range
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
    return res.status(400).json({ success: false, error: '金额无效' });
  }
  
  // Validate orderNo format (alphanumeric and dashes only, max 64 chars)
  if (!/^[a-zA-Z0-9\-]{1,64}$/.test(orderNo)) {
    return res.status(400).json({ success: false, error: '订单号格式无效' });
  }
  
  // Validate subject length
  if (typeof subject !== 'string' || subject.length > 256) {
    return res.status(400).json({ success: false, error: '订单描述过长' });
  }

  try {
    // Idempotency check: reject duplicate orderNo
    const Order = AV.Object.extend('Order');
    const existingQuery = new AV.Query(Order);
    existingQuery.equalTo('orderNo', orderNo);
    const existing = await existingQuery.first();
    if (existing) {
      return res.status(400).json({ success: false, error: '订单号已存在' });
    }

    // 调用支付宝当面付 API
    const result = await alipaySdk.exec(
      'alipay.trade.precreate',
      {
        bizContent: {
          out_trade_no: orderNo,
          total_amount: amount,
          subject: subject,
        },
      }
    );

    if (result.code === '10000') {
      res.json({ 
        success: true, 
        qrCode: result.qr_code 
      });
    } else {
      res.json({ 
        success: false, 
        error: result.msg || result.subMsg 
      });
    }
  } catch (error) {
    console.error('Alipay create order error:', error);
    res.status(500).json({ success: false, error: '创建支付订单失败' });
  }
});

// 查询订单状态
router.get('/query-order/:orderNo', async (req, res) => {
  const { orderNo } = req.params;
  
  try {
    const result = await alipaySdk.exec(
      'alipay.trade.query',
      {
        bizContent: {
          out_trade_no: orderNo,
        },
      }
    );

    const isPaid = result.code === '10000' && result.tradeStatus === 'TRADE_SUCCESS';
    
    res.json({ 
      paid: isPaid, 
      status: result.tradeStatus,
      code: result.code 
    });
  } catch (error) {
    console.error('Alipay query order error:', error);
    res.json({ paid: false, error: error.message });
  }
});

// 支付回调（支付宝异步通知）
router.post('/notify', async (req, res) => {
  // Parse raw body (set by express.raw middleware in index.js)
  let params;
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    if (!rawBody) {
      console.warn('Alipay notify: empty body');
      return res.send('fail');
    }
    // Parse URL-encoded form data into object
    params = Object.fromEntries(new URLSearchParams(rawBody));
  } catch (parseError) {
    console.error('Alipay notify body parse error:', parseError);
    return res.send('fail');
  }
  
  const { out_trade_no, trade_status, trade_no, total_amount, app_id } = params;
  
  // Verify app_id matches our application
  if (app_id && app_id !== process.env.ALIPAY_APP_ID) {
    console.warn('Alipay notify: app_id mismatch:', { received: app_id, expected: process.env.ALIPAY_APP_ID });
    return res.send('fail');
  }
  
  // 验证支付宝签名，防止伪造请求
  let signValid = false;
  try {
    signValid = alipaySdk.checkNotifySign(params);
  } catch (signError) {
    console.error('Alipay sign verification error:', signError);
  }
  
  if (!signValid) {
    console.warn('Alipay notify signature verification FAILED:', { out_trade_no, trade_status });
    return res.send('fail');
  }
  
  console.log('Alipay notify received (verified):', { out_trade_no, trade_status });

  if (trade_status === 'TRADE_SUCCESS') {
    try {
      // 查询订单并验证金额
      const Order = AV.Object.extend('Order');
      const query = new AV.Query(Order);
      query.equalTo('orderNo', out_trade_no);
      const order = await query.first();
      
      if (!order) {
        console.warn('Alipay notify: order not found:', out_trade_no);
        return res.send('success');
      }
      
      if (order.get('status') === 'completed') {
        // Already processed (idempotent)
        return res.send('success');
      }
      
      // Verify total_amount matches order price
      const orderPrice = order.get('price');
      if (orderPrice && total_amount && String(total_amount) !== String(orderPrice)) {
        console.error('Alipay notify: amount mismatch!', { 
          orderNo: out_trade_no, 
          expected: orderPrice, 
          received: total_amount 
        });
        // Still return success to Alipay to stop retries, but flag the issue
        return res.send('success');
      }
      
      order.set('status', 'completed');
      order.set('completedAt', new Date());
      order.set('alipayTradeNo', trade_no);
      await order.save();
      
      console.log('Order updated:', out_trade_no);
    } catch (error) {
      console.error('Update order error:', error);
    }
  }
  
  // 返回 success 给支付宝
  res.send('success');
});

module.exports = router;
