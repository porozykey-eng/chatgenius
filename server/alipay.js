// ChatGenius AI Backend - 支付宝支付服务 (MySQL)
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AlipaySDK = require('alipay-sdk').default;
const { pool } = require('./config');
const { generateSecureCode, generateBatchId } = require('./admin');
const { sendActivationCodeEmail } = require('./mail');

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
  console.log('✅ ALIPAY_APP_ID configured');
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

// 初始化支付宝 SDK（仅在配置完整时）
let alipaySdk = null;
if (process.env.ALIPAY_APP_ID && privateKey && alipayPublicKey) {
  alipaySdk = new AlipaySDK({
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
    // P3-8 修复：不再打印私钥首行（密钥材料泄露风险），仅打印长度和 PEM 头标识
    console.error('   Key length:', privateKey.length, 'chars, has PEM header:', privateKey.includes('-----BEGIN'));
    // 尝试用 PKCS#1 类型解析
    try {
      const obj = crypto.createPrivateKey(privateKey);
      const exported = obj.export({ format: 'pem', type: 'pkcs8' });
      console.log('   crypto.createPrivateKey (auto) succeeded, re-exported PKCS#8');
    } catch (e2) {
      console.error('   crypto.createPrivateKey (auto) also failed:', e2.message);
    }
  }
} else {
  console.warn('⚠️  支付宝配置不完整，支付功能将不可用');
}

// P0-1 修复：套餐价格白名单（服务端决定金额，前端传入的 amount 不可信）
const PLAN_PRICES = {
  year: Number(process.env.PRICE_YEAR || 99),
  lifetime: Number(process.env.PRICE_LIFETIME || 299),
};
const PLAN_SUBJECTS = {
  year: process.env.PLAN_SUBJECT_YEAR || 'ChatGenius AI 浏览器扩展-年付版',
  lifetime: process.env.PLAN_SUBJECT_LIFETIME || 'ChatGenius AI 浏览器扩展-永久版',
};

// 创建支付订单（电脑网站支付 - alipay.trade.page.pay）
// 返回支付宝支付页面 URL，前端跳转过去完成支付
router.post('/create-order', async (req, res) => {
  const { type, email } = req.body;

  if (!type) {
    return res.status(400).json({ success: false, error: '参数不完整' });
  }

  if (!PLAN_PRICES[type]) {
    return res.status(400).json({ success: false, error: '套餐类型无效' });
  }
  const numAmount = PLAN_PRICES[type];
  const subject = PLAN_SUBJECTS[type];

  // P0 安全修复：服务端生成订单号（crypto.randomBytes，CSPRNG），防止客户端可预测订单号导致激活码 IDOR
  const orderNo = 'CG' + crypto.randomBytes(12).toString('hex').toUpperCase();

  try {
    // 保存订单到数据库
    await pool.query(
      'INSERT INTO orders (order_no, plan, price, type, channel, status, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderNo, subject, numAmount, type, 'alipay', 'pending', email || null]
    );

    // 支付宝电脑网站支付：使用 pageExec 生成支付表单 HTML（v3 SDK）
    const result = await alipaySdk.pageExec(
      'alipay.trade.page.pay',
      {
        bizContent: {
          out_trade_no: orderNo,
          total_amount: numAmount.toFixed(2),
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
      orderNo,
    });
  } catch (error) {
    console.error('Alipay create order error:', error.message);
    res.status(500).json({ success: false, error: '创建支付订单失败' });
  }
});

// 查询订单状态
// P1-4 修复：激活码掩码返回 + IP 频率限制（不强制 email，保持前端兼容）
router.get('/query-order/:orderNo', async (req, res) => {
  const { orderNo } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // P1-5 修复：orderNo 格式白名单校验，防止注入
  if (!/^[A-Za-z0-9\-]{1,64}$/.test(orderNo)) {
    return res.status(400).json({ success: false, error: '订单号格式无效' });
  }

  // P1-4 修复：基于 IP 的频率限制，防止枚举订单号窃取激活码
  // 单 IP 60 秒内最多 20 次查询（支付轮询通常每 2-3 秒一次，20 次足够覆盖一次支付流程）
  const queryRateLimitKey = `query_order_${ip}`;
  if (!global[queryRateLimitKey]) global[queryRateLimitKey] = { count: 0, resetAt: Date.now() + 60000 };
  const bucket = global[queryRateLimitKey];
  if (Date.now() > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = Date.now() + 60000;
  }
  bucket.count++;
  if (bucket.count > 20) {
    return res.status(429).json({ success: false, error: '查询过于频繁，请稍后再试' });
  }

  try {
    // 优先查数据库：已完成的订单直接返回激活码
    const [rows] = await pool.query(
      'SELECT status, activation_code, type, user_email FROM orders WHERE order_no = ?',
      [orderNo]
    );

    if (rows.length === 0) {
      // 订单不在 DB（create-order 已写入），不再回查 Alipay API 防止信息泄露
      return res.status(404).json({ success: false, error: 'order not found' });
    }

    const order = rows[0];

    if (order.status === 'completed' && order.activation_code) {
      // 注意：激活码完整返回。当前邮件发送依赖前端传 email，但前端未传，落地页是用户获取激活码的唯一途径。
      // P1-4 通过 IP 频率限制（20次/60秒）降低枚举风险。后续若启用邮件发送，可改为掩码返回。
      return res.json({
        paid: true,
        status: 'TRADE_SUCCESS',
        activationCode: order.activation_code,
        type: order.type,
      });
    }

    if (order.status === 'completed' && !order.activation_code) {
      // 订单已完成但无激活码（兼容老数据），尝试查支付宝 API 确认
    }

    // 查询支付宝 API（订单未完成时回查支付宝确认支付状态）
    const result = await alipaySdk.exec('alipay.trade.query', {
      bizContent: { out_trade_no: orderNo },
    });

    const isPaid = result.code === '10000' && result.tradeStatus === 'TRADE_SUCCESS';
    res.json({ paid: isPaid, status: result.tradeStatus, code: result.code });
  } catch (error) {
    console.error('Alipay query order error:', error.message);
    res.json({ paid: false, error: '查询订单状态失败' });
  }
});

// 支付回调（支付宝异步通知）
// P1-2 修复：从 router 中提取为独立函数 handleNotify，在 index.js 中单独注册，
// 避免被 /api/alipay 下的全局限流（10次/分钟）覆盖导致回调被拒
const handleNotify = async (req, res) => {
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
    console.warn('Alipay notify: app_id mismatch (received does not match configured)');
    return res.send('fail');
  }

  // 验证支付宝签名
  let signValid = false;
  try {
    signValid = alipaySdk.checkNotifySign(params);
  } catch (signError) {
    console.error('Alipay sign verification error:', signError.message);
  }

  if (!signValid) {
    console.warn('Alipay notify signature verification FAILED:', { out_trade_no, trade_status });
    return res.send('fail');
  }

  console.log('Alipay notify received (verified):', { out_trade_no, trade_status });

  if (trade_status === 'TRADE_SUCCESS') {
    let conn;
    let dbFailed = false;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // 查询订单并验证金额
      const [rows] = await conn.query(
        'SELECT id, status, price, type, user_email FROM orders WHERE order_no = ? FOR UPDATE',
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

      // P1 安全修复：金额强制精确匹配（移除条件分支，缺失即拒绝）
      const expectedStr = parseFloat(order.price).toFixed(2);
      const receivedStr = parseFloat(total_amount).toFixed(2);
      if (isNaN(parseFloat(expectedStr)) || isNaN(parseFloat(receivedStr)) || expectedStr !== receivedStr) {
        console.error('Alipay notify: amount mismatch!', {
          orderNo: out_trade_no,
          expected: expectedStr,
          received: receivedStr
        });
        await conn.rollback();
        return res.send('success');
      }

      // 更新订单状态
      await conn.query(
        'UPDATE orders SET status = ?, completed_at = ?, alipay_trade_no = ? WHERE id = ?',
        ['completed', new Date(), trade_no, order.id]
      );

      // 生成激活码（与 admin.js /orders/:orderNo/complete 逻辑一致）
      const prefixMap = { year: 'YEAR', lifetime: 'PRO' };
      const prefix = prefixMap[order.type] || 'YEAR';
      const code = generateSecureCode(prefix);
      await conn.query(
        'INSERT INTO activation_codes (code, type, status, batch_id) VALUES (?, ?, ?, ?)',
        [code, order.type || 'year', 'unused', generateBatchId()]
      );
      await conn.query(
        'UPDATE orders SET activation_code = ? WHERE id = ?',
        [code, order.id]
      );

      await conn.commit();
      console.log('Order updated:', out_trade_no);

      // 异步发送激活码邮件（不阻塞回调响应）
      if (order.user_email) {
        const planName = order.type === 'lifetime' ? '终身版' : '年付版';
        const expiresAt = order.type === 'lifetime' ? '永久有效' : new Date(Date.now() + 365 * 86400 * 1000).toLocaleDateString('zh-CN');
        sendActivationCodeEmail(order.user_email, {
          activationCode: code,
          plan: planName,
          orderNo: out_trade_no,
          expiresAt,
        }).catch(err => console.error('发送激活码邮件失败:', err.message));
      }
    } catch (error) {
      if (conn) await conn.rollback();
      console.error('Update order error:', error.message);
      // P0-2 修复：DB 事务失败，标记失败，让支付宝平台重试回调（不再返回 success）
      dbFailed = true;
    } finally {
      if (conn) conn.release();
    }
    // P0-2 修复：事务失败时返回 500 fail，支付宝会重试；正常流程返回 success
    if (dbFailed) {
      return res.status(500).send('fail');
    }
  }

  res.send('success');
};

// 导出 handleNotify 供 index.js 单独注册（绕过限流）
router.handleNotify = handleNotify;

module.exports = router;
