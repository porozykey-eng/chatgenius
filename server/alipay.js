// ChatGenius AI Backend - 支付宝支付服务 (MySQL)
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AlipaySDK = require('alipay-sdk').default;
const { pool } = require('./config');

const router = express.Router();

// 读取密钥：支持文件路径、直接内容、或纯base64
function readKey(envValue) {
  if (!envValue) return '';
  let key = envValue;
  // 如果是文件路径，读取文件内容
  if (key.startsWith('/') || key.startsWith('./')) {
    const filePath = path.resolve(__dirname, key);
    // 读取为 buffer 以处理可能的 BOM 和编码问题
    const buffer = fs.readFileSync(filePath);
    // 移除 UTF-8 BOM (EF BB BF)
    const start = (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) ? 3 : 0;
    key = buffer.slice(start).toString('utf8');
  } else {
    key = key.replace(/\\n/g, '\n');
  }
  // 清理：移除 BOM、CRLF 转 LF、首尾空白
  key = key
    .replace(/^\uFEFF/, '')  // 移除 BOM
    .replace(/\r\n/g, '\n')  // CRLF -> LF
    .replace(/\r/g, '\n')    // CR -> LF
    .trim();
  return key;
}

// 智能处理私钥格式，兼容 OpenSSL 3.0
function processPrivateKey(key) {
  if (!key) return key;

  // 如果已经有正确的 PKCS#8 头，直接返回
  if (key.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('✅ Private key is already PKCS#8 format');
    return key;
  }

  // 如果是 PKCS#1 格式，尝试转换
  if (key.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    try {
      const obj = crypto.createPrivateKey({ key, format: 'pem', type: 'pkcs1' });
      const pkcs8 = obj.export({ format: 'pem', type: 'pkcs8' });
      console.log('✅ Private key converted from PKCS#1 to PKCS#8');
      return pkcs8;
    } catch (e) {
      console.error('❌ PKCS#1 parse failed:', e.message);
    }
  }

  // 纯 base64 密钥（无 PEM 头），尝试 PKCS#8 和 PKCS#1
  if (!key.includes('-----BEGIN')) {
    const wrapped = key.match(/.{1,64}/g)?.join('\n') || key;

    // 先尝试作为 PKCS#8
    try {
      const pkcs8Key = '-----BEGIN PRIVATE KEY-----\n' + wrapped + '\n-----END PRIVATE KEY-----';
      const obj = crypto.createPrivateKey({ key: pkcs8Key, format: 'pem', type: 'pkcs8' });
      const exported = obj.export({ format: 'pem', type: 'pkcs8' });
      console.log('✅ Raw base64 key detected as PKCS#8');
      return exported;
    } catch (e1) {
      // 再尝试作为 PKCS#1
      try {
        const pkcs1Key = '-----BEGIN RSA PRIVATE KEY-----\n' + wrapped + '\n-----END RSA PRIVATE KEY-----';
        const obj = crypto.createPrivateKey({ key: pkcs1Key, format: 'pem', type: 'pkcs1' });
        const exported = obj.export({ format: 'pem', type: 'pkcs8' });
        console.log('✅ Raw base64 key detected as PKCS#1, converted to PKCS#8');
        return exported;
      } catch (e2) {
        console.error('❌ Cannot parse private key as PKCS#8 or PKCS#1');
        console.error('  PKCS#8 error:', e1.message);
        console.error('  PKCS#1 error:', e2.message);
      }
    }
    return key;
  }

  return key;
}

// 智能处理公钥格式
function processPublicKey(key) {
  if (!key) return key;

  // 已经是 SPKI 格式
  if (key.includes('-----BEGIN PUBLIC KEY-----')) {
    console.log('✅ Public key is already SPKI format');
    return key;
  }

  // PKCS#1 公钥格式
  if (key.includes('-----BEGIN RSA PUBLIC KEY-----')) {
    try {
      const obj = crypto.createPublicKey({ key, format: 'pem', type: 'pkcs1' });
      const spki = obj.export({ format: 'pem', type: 'spki' });
      console.log('✅ Public key converted from PKCS#1 to SPKI');
      return spki;
    } catch (e) {
      console.error('❌ Public key PKCS#1 parse failed:', e.message);
    }
  }

  // 纯 base64 公钥
  if (!key.includes('-----BEGIN')) {
    const wrapped = key.match(/.{1,64}/g)?.join('\n') || key;

    // 先尝试 SPKI
    try {
      const spkiKey = '-----BEGIN PUBLIC KEY-----\n' + wrapped + '\n-----END PUBLIC KEY-----';
      const obj = crypto.createPublicKey({ key: spkiKey, format: 'pem', type: 'spki' });
      console.log('✅ Raw base64 public key detected as SPKI');
      return obj.export({ format: 'pem', type: 'spki' });
    } catch (e1) {
      // 再尝试 PKCS#1
      try {
        const pkcs1Key = '-----BEGIN RSA PUBLIC KEY-----\n' + wrapped + '\n-----END RSA PUBLIC KEY-----';
        const obj = crypto.createPublicKey({ key: pkcs1Key, format: 'pem', type: 'pkcs1' });
        console.log('✅ Raw base64 public key detected as PKCS#1, converted to SPKI');
        return obj.export({ format: 'pem', type: 'spki' });
      } catch (e2) {
        console.error('❌ Cannot parse public key');
        console.error('  SPKI error:', e1.message);
        console.error('  PKCS#1 error:', e2.message);
      }
    }
    return key;
  }

  return key;
}

// 读取并处理密钥
const rawPrivateKey = readKey(process.env.ALIPAY_PRIVATE_KEY);
const rawPublicKey = readKey(process.env.ALIPAY_PUBLIC_KEY);
const privateKey = processPrivateKey(rawPrivateKey);
const alipayPublicKey = processPublicKey(rawPublicKey);

// 验证密钥是否已配置
if (!process.env.ALIPAY_APP_ID) {
  console.error('❌ ALIPAY_APP_ID 未配置！支付功能将无法使用');
} else {
  console.log('✅ ALIPAY_APP_ID:', process.env.ALIPAY_APP_ID);
}
if (!rawPrivateKey) {
  console.error('❌ ALIPAY_PRIVATE_KEY 未配置！');
} else {
  console.log('✅ ALIPAY_PRIVATE_KEY loaded, length:', rawPrivateKey.length);
}
if (!rawPublicKey) {
  console.error('❌ ALIPAY_PUBLIC_KEY 未配置！');
} else {
  console.log('✅ ALIPAY_PUBLIC_KEY loaded, length:', rawPublicKey.length);
}

// 初始化支付宝 SDK
const alipaySdk = new AlipaySDK({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: privateKey,
  alipayPublicKey: alipayPublicKey,
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  signType: 'RSA2',
  keyType: 'PKCS8',  // 明确指定私钥格式为 PKCS#8
});

// 启动时验证密钥是否可用
try {
  const testSign = crypto.createSign('RSA-SHA256');
  testSign.update('test');
  const signature = testSign.sign(privateKey, 'base64');
  console.log('✅ Private key signing test PASSED (RSA-SHA256)');
} catch (e) {
  console.error('❌ Private key signing test FAILED:', e.message);
  console.error('   Key first line:', privateKey.split('\n')[0]);
  console.error('   Key length:', privateKey.length, 'chars');
  // 尝试用 PKCS#1 类型解析
  try {
    const obj = crypto.createPrivateKey(privateKey);
    const exported = obj.export({ format: 'pem', type: 'pkcs8' });
    console.log('   crypto.createPrivateKey (auto) succeeded, re-exported PKCS#8');
  } catch (e2) {
    console.error('   crypto.createPrivateKey (auto) also failed:', e2.message);
  }
}

// 创建支付订单（电脑网站支付 - alipay.trade.page.pay）
// 返回支付宝支付页面 URL，前端跳转过去完成支付
router.post('/create-order', async (req, res) => {
  const { orderNo, amount, subject } = req.body;

  if (!orderNo || !amount || !subject) {
    return res.status(400).json({ success: false, error: '参数不完整' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
    return res.status(400).json({ success: false, error: '金额无效' });
  }

  if (!/^[a-zA-Z0-9\-]{1,64}$/.test(orderNo)) {
    return res.status(400).json({ success: false, error: '订单号格式无效' });
  }

  if (typeof subject !== 'string' || subject.length > 256) {
    return res.status(400).json({ success: false, error: '订单描述过长' });
  }

  try {
    // Idempotency check
    const [existing] = await pool.query('SELECT id FROM orders WHERE order_no = ?', [orderNo]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '订单号已存在' });
    }

    console.log('Creating Alipay page pay order:', { orderNo, amount, subject });

    // 支付宝电脑网站支付：使用 pageExec 生成支付表单 HTML（v3 SDK）
    const result = await alipaySdk.pageExec(
      'alipay.trade.page.pay',
      {
        bizContent: {
          out_trade_no: orderNo,
          total_amount: amount,
          subject: subject,
          product_code: 'FAST_INSTANT_TRADE_PAY',
        },
        returnUrl: process.env.ALIPAY_RETURN_URL || 'https://chat.sopie.cc/payment-return',
        notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'https://chat.sopie.cc/api/alipay/notify',
      },
      'GET'
    );

    console.log('Alipay page pay form generated, length:', result ? result.length : 'null');

    // result 是一个完整的 HTML form 字符串，前端直接用 document.write 提交
    res.json({
      success: true,
      payForm: result,
    });
  } catch (error) {
    console.error('Alipay create order error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: '创建支付订单失败: ' + error.message });
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
  let params;
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    if (!rawBody) {
      console.warn('Alipay notify: empty body');
      return res.send('fail');
    }
    params = Object.fromEntries(new URLSearchParams(rawBody));
  } catch (parseError) {
    console.error('Alipay notify body parse error:', parseError);
    return res.send('fail');
  }
  
  const { out_trade_no, trade_status, trade_no, total_amount, app_id } = params;
  
  if (app_id && app_id !== process.env.ALIPAY_APP_ID) {
    console.warn('Alipay notify: app_id mismatch:', { received: app_id, expected: process.env.ALIPAY_APP_ID });
    return res.send('fail');
  }
  
  // 验证支付宝签名
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
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 查询订单并验证金额
      const [rows] = await conn.query(
        'SELECT id, status, price FROM orders WHERE order_no = ? FOR UPDATE',
        [out_trade_no]
      );
      
      if (rows.length === 0) {
        console.warn('Alipay notify: order not found:', out_trade_no);
        await conn.rollback();
        return res.send('success');
      }
      
      const order = rows[0];
      
      if (order.status === 'completed') {
        await conn.rollback();
        return res.send('success');
      }
      
      // Verify amount
      if (order.price && total_amount && String(total_amount) !== String(order.price)) {
        console.error('Alipay notify: amount mismatch!', { 
          orderNo: out_trade_no, 
          expected: order.price, 
          received: total_amount 
        });
        await conn.rollback();
        return res.send('success');
      }
      
      // 更新订单状态
      await conn.query(
        'UPDATE orders SET status = ?, completed_at = ?, alipay_trade_no = ? WHERE id = ?',
        ['completed', new Date(), trade_no, order.id]
      );
      
      await conn.commit();
      console.log('Order updated:', out_trade_no);
    } catch (error) {
      if (conn) await conn.rollback();
      console.error('Update order error:', error);
    } finally {
      if (conn) conn.release();
    }
  }
  
  res.send('success');
});

module.exports = router;
