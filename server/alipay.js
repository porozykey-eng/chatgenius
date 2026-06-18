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
    key = fs.readFileSync(filePath, 'utf8').trim();
  } else {
    key = key.replace(/\\n/g, '\n');
  }
  // 如果没有 PEM 头，自动添加（纯 base64 密钥）
  if (!key.includes('-----BEGIN')) {
    const wrapped = key.match(/.{1,64}/g).join('\n');
    key = '-----BEGIN RSA PRIVATE KEY-----\n' + wrapped + '\n-----END RSA PRIVATE KEY-----';
  }
  return key;
}

// 将 PKCS#1 私钥转换为 PKCS#8（兼容 Node.js 17+ / OpenSSL 3.0）
function convertPrivateKeyToPKCS8(key) {
  if (!key.includes('-----BEGIN RSA PRIVATE KEY-----')) return key;
  try {
    // 使用 Node.js crypto 模块自动转换
    const privateKeyObj = crypto.createPrivateKey({ key, format: 'pem', type: 'pkcs1' });
    const pkcs8 = privateKeyObj.export({ format: 'pem', type: 'pkcs8' });
    console.log('✅ Private key converted from PKCS#1 to PKCS#8 successfully');
    return pkcs8;
  } catch (e) {
    console.error('❌ PKCS#1 to PKCS#8 conversion failed:', e.message);
    return key; // 返回原始密钥，让 SDK 尝试处理
  }
}

// 将 PKCS#1 公钥转换为 PKCS/X.509 SubjectPublicKeyInfo 格式
function convertPublicKey(key) {
  if (!key.includes('-----BEGIN RSA PUBLIC KEY-----')) return key;
  try {
    const publicKeyObj = crypto.createPublicKey({ key, format: 'pem', type: 'pkcs1' });
    const spki = publicKeyObj.export({ format: 'pem', type: 'spki' });
    console.log('✅ Public key converted to SPKI format successfully');
    return spki;
  } catch (e) {
    console.error('❌ Public key conversion failed:', e.message);
    return key;
  }
}

// 读取并转换密钥
const rawPrivateKey = readKey(process.env.ALIPAY_PRIVATE_KEY);
const rawPublicKey = readKey(process.env.ALIPAY_PUBLIC_KEY);
const privateKey = convertPrivateKeyToPKCS8(rawPrivateKey);
const alipayPublicKey = convertPublicKey(rawPublicKey);

// 验证密钥是否已配置
if (!process.env.ALIPAY_APP_ID) {
  console.error('❌ ALIPAY_APP_ID 未配置！支付功能将无法使用');
}
if (!rawPrivateKey) {
  console.error('❌ ALIPAY_PRIVATE_KEY 未配置！支付功能将无法使用');
}
if (!rawPublicKey) {
  console.error('❌ ALIPAY_PUBLIC_KEY 未配置！支付功能将无法使用');
}

// 初始化支付宝 SDK
const alipaySdk = new AlipaySDK({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: privateKey,
  alipayPublicKey: alipayPublicKey,
  gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
});

// 创建预支付订单（当面付 - 生成二维码）
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

    console.log('Creating Alipay precreate order:', { orderNo, amount, subject });

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

    console.log('Alipay SDK response:', JSON.stringify(result, null, 2));

    if (result.code === '10000') {
      console.log('Order created successfully, qr_code:', result.qr_code);
      res.json({ 
        success: true, 
        qrCode: result.qr_code 
      });
    } else {
      console.error('Alipay API error:', { code: result.code, msg: result.msg, subMsg: result.subMsg });
      res.json({ 
        success: false, 
        error: result.subMsg || result.msg || '支付宝接口调用失败'
      });
    }
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
