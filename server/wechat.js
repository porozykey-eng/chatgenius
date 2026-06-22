// ChatGenius AI Backend - 微信支付服务 (Native 扫码支付)
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('./config');

const router = express.Router();

// 读取密钥文件
function readKeyFile(filename) {
  const filePath = path.resolve(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  // 移除 UTF-8 BOM
  const start = (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) ? 3 : 0;
  return buffer.slice(start).toString('utf8').trim();
}

// 微信支付配置
const WECHAT_MCHID = process.env.WECHAT_MCHID;
const WECHAT_API_V3_KEY = process.env.WECHAT_API_V3_KEY;
const WECHAT_SERIAL_NO = process.env.WECHAT_SERIAL_NO;

// 读取证书
const merchantPrivateKey = readKeyFile('wechat_key.pem');
const merchantCertificate = readKeyFile('wechat_cert.pem');

// 验证配置
if (!WECHAT_MCHID) {
  console.error('❌ WECHAT_MCHID 未配置！微信支付将无法使用');
} else {
  console.log('✅ WECHAT_MCHID:', WECHAT_MCHID);
}
if (!WECHAT_API_V3_KEY) {
  console.error('❌ WECHAT_API_V3_KEY 未配置！');
} else {
  console.log('✅ WECHAT_API_V3_KEY configured');
}
if (!WECHAT_SERIAL_NO) {
  console.error('❌ WECHAT_SERIAL_NO 未配置！');
} else {
  console.log('✅ WECHAT_SERIAL_NO:', WECHAT_SERIAL_NO);
}
if (!merchantPrivateKey) {
  console.error('❌ wechat_key.pem 未找到！');
} else {
  console.log('✅ wechat_key.pem loaded');
}
if (!merchantCertificate) {
  console.error('❌ wechat_cert.pem 未找到！');
} else {
  console.log('✅ wechat_cert.pem loaded');
}

// 微信支付 API 基础 URL
const WECHAT_API_BASE = 'https://api.mch.weixin.qq.com';

// 生成签名（用于请求头 Authorization）
function generateAuthorization(method, url, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body || ''}\n`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  const signature = sign.sign(merchantPrivateKey, 'base64');
  
  return `WECHATPAY2-SHA256-RSA2048 mchid="${WECHAT_MCHID}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${WECHAT_SERIAL_NO}"`;
}

// 解密微信支付回调数据
function decryptGCM(ciphertext, nonce, associatedData) {
  const key = Buffer.from(WECHAT_API_V3_KEY, 'utf8');
  const decipher = crypto.createDecipheriv('aes-256-gcm', nonce, null);
  decipher.setAuthTag(Buffer.from(ciphertext.slice(-16), 'base64'));
  decipher.setAAD(Buffer.from(associatedData));
  
  const decrypted = decipher.update(Buffer.from(ciphertext.slice(0, -16), 'base64'), 'binary', 'utf8');
  decipher.final('utf8');
  return JSON.parse(decrypted);
}

// 创建 Native 支付订单（PC 端扫码支付）
router.post('/create-order', async (req, res) => {
  const { orderNo, amount, subject, type } = req.body;

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

  if (typeof subject !== 'string' || subject.length > 127) {
    return res.status(400).json({ success: false, error: '订单描述过长' });
  }

  try {
    // 检查订单是否已存在
    const [existing] = await pool.query('SELECT id FROM orders WHERE order_no = ?', [orderNo]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '订单号已存在' });
    }

    console.log('Creating WeChat Native pay order:', { orderNo, amount, subject });

    // 金额转为分
    const totalFee = Math.round(numAmount * 100);

    // 请求体（Native 支付不需要 appid）
    const body = JSON.stringify({
      mchid: WECHAT_MCHID,
      description: subject,
      out_trade_no: orderNo,
      notify_url: process.env.WECHAT_NOTIFY_URL || 'https://chat.sopie.cc/api/wechat/notify',
      amount: {
        total: totalFee,
        currency: 'CNY',
      },
    });

    // 生成签名
    const urlPath = '/v3/pay/transactions/native';
    const authorization = generateAuthorization('POST', urlPath, body);

    // 调用微信支付 API
    const response = await fetch(`${WECHAT_API_BASE}${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'Accept': 'application/json',
      },
      body,
    });

    const data = await response.json();
    console.log('WeChat Native pay response:', JSON.stringify(data));

    if (data.code_url) {
      // 保存订单到数据库
      await pool.query(
        'INSERT INTO orders (order_no, plan, price, type, channel, status) VALUES (?, ?, ?, ?, ?, ?)',
        [orderNo, subject, numAmount, type === 'year' ? 'year' : 'lifetime', 'wechat', 'pending']
      );

      res.json({
        success: true,
        codeUrl: data.code_url,  // 二维码链接
        orderNo,
      });
    } else {
      console.error('WeChat pay error:', data);
      res.status(500).json({ success: false, error: data.message || '创建支付订单失败' });
    }
  } catch (error) {
    console.error('WeChat create order error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: '创建支付订单失败: ' + error.message });
  }
});

// 查询订单状态
router.get('/query-order/:orderNo', async (req, res) => {
  const { orderNo } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT status FROM orders WHERE order_no = ?',
      [orderNo]
    );

    if (rows.length === 0) {
      return res.json({ paid: false, error: '订单不存在' });
    }

    const order = rows[0];
    const isPaid = order.status === 'completed';

    res.json({ paid: isPaid, status: order.status });
  } catch (error) {
    console.error('WeChat query order error:', error);
    res.json({ paid: false, error: error.message });
  }
});

// 支付回调（微信支付异步通知）
router.post('/notify', async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const body = JSON.parse(rawBody);

    console.log('WeChat notify received:', JSON.stringify(body));

    // 验证签名
    const timestamp = req.headers['wechatpay-timestamp'];
    const nonce = req.headers['wechatpay-nonce'];
    const signature = req.headers['wechatpay-signature'];
    const serial = req.headers['wechatpay-serial'];

    if (!timestamp || !nonce || !signature) {
      console.warn('WeChat notify: missing headers');
      return res.status(400).json({ code: 'FAIL', message: '缺少签名参数' });
    }

    const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message);
    const isValid = verify.verify(merchantCertificate, signature, 'base64');

    if (!isValid) {
      console.warn('WeChat notify: signature verification FAILED');
      return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });
    }

    console.log('WeChat notify signature verified');

    // 解密回调数据
    const resource = body.resource;
    const decrypted = decryptGCM(resource.ciphertext, Buffer.from(resource.nonce, 'base64'), resource.associated_data);

    console.log('WeChat notify decrypted:', JSON.stringify(decrypted));

    const { out_trade_no, trade_state, transaction_id } = decrypted;

    if (trade_state === 'SUCCESS') {
      let conn;
      try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [rows] = await conn.query(
          'SELECT id, status, price FROM orders WHERE order_no = ? FOR UPDATE',
          [out_trade_no]
        );

        if (rows.length === 0) {
          console.warn('WeChat notify: order not found:', out_trade_no);
          await conn.rollback();
          return res.json({ code: 'SUCCESS', message: '成功' });
        }

        const order = rows[0];

        if (order.status === 'completed') {
          await conn.rollback();
          return res.json({ code: 'SUCCESS', message: '成功' });
        }

        // 更新订单状态
        await conn.query(
          'UPDATE orders SET status = ?, completed_at = ?, wechat_trade_no = ? WHERE id = ?',
          ['completed', new Date(), transaction_id, order.id]
        );

        await conn.commit();
        console.log('WeChat order updated:', out_trade_no);
      } catch (error) {
        if (conn) await conn.rollback();
        console.error('Update wechat order error:', error);
      } finally {
        if (conn) conn.release();
      }
    }

    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('WeChat notify error:', error);
    res.status(500).json({ code: 'FAIL', message: error.message });
  }
});

module.exports = router;
