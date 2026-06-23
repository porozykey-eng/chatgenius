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

// ================================
// 临时接口：获取您的 OpenID（获取后可删除此段）
// ================================
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

// 一个接口处理两种情况：无 code 时跳转授权，有 code 时换取 openid
router.get('/get-openid', async (req, res) => {
  const { code } = req.query;

  // 情况1：没有 code，跳转到微信授权页
  if (!code) {
    if (!WECHAT_APPID || !WECHAT_APP_SECRET) {
      return res.send('<h2>请先在 .env 配置 WECHAT_APPID 和 WECHAT_APP_SECRET</h2>');
    }
    const redirectUri = encodeURIComponent('https://chat.sopie.cc/api/wechat/get-openid');
    const scope = 'snsapi_userinfo';
    const state = 'chatgenius';
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_APPID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
    return res.redirect(authUrl);
  }

  // 情况2：有 code，用 code 换取 openid
  try {
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_APP_SECRET}&code=${code}&grant_type=authorization_code`;
    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(tokenUrl);
    const data = await resp.json();

    if (data.errcode) {
      return res.send(`<h2>获取失败：${data.errmsg}（错误码：${data.errcode}）</h2>`);
    }

    const { openid } = data;
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:-apple-system,sans-serif;padding:40px;background:#fafafa;">
        <div style="max-width:500px;margin:0 auto;background:#fff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;">
          <h2 style="margin:0 0 16px;color:#111827;">✅ 获取成功</h2>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">您的 OpenID 已获取，请复制下方内容：</p>
          <div style="background:#f5f5f5;padding:16px;border-radius:4px;border:1px solid #e5e7eb;margin-bottom:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">OpenID:</p>
            <p style="margin:0;font-family:monospace;font-size:14px;color:#111827;word-break:break-all;">${openid}</p>
          </div>
          <button onclick="navigator.clipboard.writeText('${openid}');alert('已复制到剪贴板')" style="width:100%;padding:10px;background:#111827;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;">复制 OpenID</button>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.send(`<h2>错误：${error.message}</h2>`);
  }
});

module.exports = router;
