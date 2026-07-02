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
const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_MCHID = process.env.WECHAT_MCHID;
const WECHAT_API_V3_KEY = process.env.WECHAT_API_V3_KEY;
const WECHAT_SERIAL_NO = process.env.WECHAT_SERIAL_NO;

// 读取证书
const merchantPrivateKey = readKeyFile('wechat_key.pem');
const merchantCertificate = readKeyFile('wechat_cert.pem');

// 验证配置
if (!WECHAT_APPID) {
  console.error('❌ WECHAT_APPID 未配置！微信支付将无法使用');
} else {
  console.log('✅ WECHAT_APPID:', WECHAT_APPID);
}
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
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(Buffer.from(ciphertext.slice(-16), 'base64'));
  decipher.setAAD(Buffer.from(associatedData));

  const decrypted = decipher.update(Buffer.from(ciphertext.slice(0, -16), 'base64'), 'binary', 'utf8');
  decipher.final('utf8');
  return JSON.parse(decrypted);
}

// ================================
// 微信平台证书管理（用于回调验签）
// ================================
const platformCertificates = new Map(); // serial_no -> certificate PEM
let platformCertLastFetch = 0;
const PLATFORM_CERT_REFRESH_MS = 12 * 60 * 60 * 1000; // 12 小时刷新一次

// 解密平台证书（与回调数据解密逻辑一致，但返回字符串而非 JSON）
function decryptCertificate(encryptCertificate) {
  const key = Buffer.from(WECHAT_API_V3_KEY, 'utf8');
  const nonce = Buffer.from(encryptCertificate.nonce, 'utf8');
  const ciphertext = Buffer.from(encryptCertificate.ciphertext, 'base64');
  const associatedData = Buffer.from(encryptCertificate.associated_data || '', 'utf8');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(ciphertext.slice(-16));
  decipher.setAAD(associatedData);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext.slice(0, -16)),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// 从微信服务器下载并缓存所有平台证书
async function downloadPlatformCertificates() {
  const urlPath = '/v3/certificates';
  const authorization = generateAuthorization('GET', urlPath, '');
  const response = await fetch(`${WECHAT_API_BASE}${urlPath}`, {
    method: 'GET',
    headers: {
      'Authorization': authorization,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download platform certificates: ${response.status}`);
  }

  const data = await response.json();
  platformCertificates.clear();
  for (const cert of data.data) {
    const certContent = decryptCertificate(cert.encrypt_certificate);
    platformCertificates.set(cert.serial_no, certContent);
  }
  platformCertLastFetch = Date.now();
  console.log(`✅ Downloaded ${platformCertificates.size} WeChat platform certificates`);
}

// 根据 serial 获取平台证书（必要时自动刷新）
async function getPlatformCertificate(serial) {
  // 如果缓存为空或过期，重新下载
  if (platformCertificates.size === 0 || Date.now() - platformCertLastFetch > PLATFORM_CERT_REFRESH_MS) {
    await downloadPlatformCertificates();
  }
  return platformCertificates.get(serial);
}

// P0-1 修复：套餐价格白名单（服务端决定金额，前端传入的 amount 不可信）
const PLAN_PRICES = {
  year: Number(process.env.PRICE_YEAR || 99),
  lifetime: Number(process.env.PRICE_LIFETIME || 299),
};
const PLAN_SUBJECTS = {
  year: process.env.PLAN_SUBJECT_YEAR || '出海工作台效率插件-年付版',
  lifetime: process.env.PLAN_SUBJECT_LIFETIME || '出海工作台效率插件-终身版',
};

// 创建 Native 支付订单（PC 端扫码支付）
router.post('/create-order', async (req, res) => {
  const { orderNo, type } = req.body;

  if (!orderNo || !type) {
    return res.status(400).json({ success: false, error: '参数不完整' });
  }

  if (!PLAN_PRICES[type]) {
    return res.status(400).json({ success: false, error: '套餐类型无效' });
  }
  const numAmount = PLAN_PRICES[type];
  const subject = PLAN_SUBJECTS[type];

  if (!/^[a-zA-Z0-9\-]{1,64}$/.test(orderNo)) {
    return res.status(400).json({ success: false, error: '订单号格式无效' });
  }

  try {
    // 检查订单是否已存在
    const [existing] = await pool.query('SELECT id FROM orders WHERE order_no = ?', [orderNo]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '订单号已存在' });
    }

    console.log('Creating WeChat Native pay order:', { orderNo, amount: numAmount, subject });

    // 金额转为分
    const totalFee = Math.round(numAmount * 100);

    // 请求体
    const body = JSON.stringify({
      appid: WECHAT_APPID,
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
        [orderNo, subject, numAmount, type, 'wechat', 'pending']
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
    res.status(500).json({ success: false, error: '创建支付订单失败' });
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
    res.json({ paid: false, error: '查询订单状态失败' });
  }
});

// 支付回调（微信支付异步通知）
router.post('/notify', async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const body = JSON.parse(rawBody);

    console.log('WeChat notify received:', JSON.stringify(body));

    // 验证签名（使用微信平台证书，而非商户证书）
    const timestamp = req.headers['wechatpay-timestamp'];
    const nonce = req.headers['wechatpay-nonce'];
    const signature = req.headers['wechatpay-signature'];
    const serial = req.headers['wechatpay-serial'];

    if (!timestamp || !nonce || !signature || !serial) {
      console.warn('WeChat notify: missing signature headers');
      return res.status(400).json({ code: 'FAIL', message: '缺少签名参数' });
    }

    // 根据 serial 获取对应的微信平台证书
    let platformCert;
    try {
      platformCert = await getPlatformCertificate(serial);
    } catch (certError) {
      console.error('WeChat notify: failed to fetch platform certificate:', certError.message);
      return res.status(400).json({ code: 'FAIL', message: '证书获取失败' });
    }

    if (!platformCert) {
      console.warn('WeChat notify: platform certificate not found for serial:', serial);
      return res.status(400).json({ code: 'FAIL', message: '证书验证失败：未知序列号' });
    }

    const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message);
    const isValid = verify.verify(platformCert, signature, 'base64');

    if (!isValid) {
      console.warn('WeChat notify: signature verification FAILED for serial:', serial);
      return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });
    }

    console.log('WeChat notify signature verified (platform cert, serial:', serial + ')');

    // 解密回调数据
    const resource = body.resource;
    const decrypted = decryptGCM(resource.ciphertext, Buffer.from(resource.nonce, 'base64'), resource.associated_data);

    console.log('WeChat notify decrypted:', JSON.stringify(decrypted));

    const { out_trade_no, trade_state, transaction_id, amount: paidAmount, appid, mchid } = decrypted;

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

        // P0-2 修复：校验 appid 和 mchid
        if (appid !== WECHAT_APPID || mchid !== WECHAT_MCHID) {
          console.warn('wechat notify: appid/mchid mismatch', { received_appid: appid, received_mchid: mchid });
          await conn.rollback();
          return res.json({ code: 'SUCCESS', message: '成功' });
        }
        // P0-2 修复：校验支付金额（paidAmount.total 单位为分）
        const expectedFen = Math.round(parseFloat(order.price) * 100);
        if (!paidAmount || paidAmount.total !== expectedFen) {
          console.error('wechat notify: amount mismatch!', { expected: expectedFen, received: paidAmount?.total });
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
    res.status(500).json({ code: 'FAIL', message: '服务器内部错误' });
  }
});

module.exports = router;
