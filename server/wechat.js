// ChatGenius AI Backend - 微信支付服务 (Native 扫码支付)
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('./config');
const { generateSecureCode, generateBatchId } = require('./admin');
const { sendActivationCodeEmail } = require('./mail');

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
// P3-8 修复：启动日志仅显示 configured 状态，不输出敏感标识符
if (!WECHAT_APPID) {
  console.error('❌ WECHAT_APPID 未配置！微信支付将无法使用');
} else {
  console.log('✅ WECHAT_APPID configured');
}
if (!WECHAT_MCHID) {
  console.error('❌ WECHAT_MCHID 未配置！微信支付将无法使用');
} else {
  console.log('✅ WECHAT_MCHID configured');
}
if (!WECHAT_API_V3_KEY) {
  console.error('❌ WECHAT_API_V3_KEY 未配置！');
} else {
  console.log('✅ WECHAT_API_V3_KEY configured');
}
if (!WECHAT_SERIAL_NO) {
  console.error('❌ WECHAT_SERIAL_NO 未配置！');
} else {
  console.log('✅ WECHAT_SERIAL_NO configured');
}
if (!merchantPrivateKey) {
  console.error('❌ wechat_key.pem 未找到或为空！微信支付功能将不可用');
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
  if (!merchantPrivateKey) {
    throw new Error('微信支付私钥未配置');
  }
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
  const ciphertextBuf = Buffer.from(ciphertext, 'base64'); // 先转 Buffer
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(ciphertextBuf.slice(-16));           // Buffer 切片 = 16 字节
  decipher.setAAD(Buffer.from(associatedData));

  const decrypted = decipher.update(ciphertextBuf.slice(0, -16), 'binary', 'utf8');
  decipher.final('utf8');
  return JSON.parse(decrypted);
}

// ================================
// 微信平台证书管理（用于回调验签）
// ================================
const platformCertificates = new Map(); // serial_no -> certificate PEM
let platformCertLastFetch = 0;
let platformCertFetchPromise = null; // M6 修复：并发控制锁，避免多次并发触发下载
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
  // P2-16 修复：添加 10 秒超时，避免 fetch 无限挂起
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(`${WECHAT_API_BASE}${urlPath}`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

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
  // 如果缓存为空或过期，重新下载（M6 修复：并发控制，避免多次并发同时触发下载）
  if (platformCertificates.size === 0 || Date.now() - platformCertLastFetch > PLATFORM_CERT_REFRESH_MS) {
    if (!platformCertFetchPromise) {
      platformCertFetchPromise = downloadPlatformCertificates().finally(() => {
        platformCertFetchPromise = null;
      });
    }
    await platformCertFetchPromise;
  }
  return platformCertificates.get(serial);
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

// 创建 Native 支付订单（PC 端扫码支付）
router.post('/create-order', async (req, res) => {
  const { type, email, renewal_code } = req.body;

  // 续费流程:验证激活码可续费并强制 type='year'
  let finalType = type;
  const normalizedRenewalCode = renewal_code ? String(renewal_code).toUpperCase() : null;
  if (normalizedRenewalCode) {
    if (!/^[A-Za-z0-9\-]{1,64}$/.test(normalizedRenewalCode)) {
      return res.status(400).json({ success: false, error: '激活码格式无效' });
    }
    try {
      const [licRows] = await pool.query(
        'SELECT type, is_active FROM licenses WHERE activation_code = ?',
        [normalizedRenewalCode]
      );
      if (licRows.length === 0) {
        return res.status(400).json({ success: false, error: '激活码不存在' });
      }
      if (licRows[0].type !== 'year') {
        return res.status(400).json({ success: false, error: '永久版无需续费' });
      }
      if (!licRows[0].is_active) {
        return res.status(400).json({ success: false, error: '许可证已撤销,请联系客服' });
      }
      // 检查是否已有 pending 续费订单
      const [pendingRows] = await pool.query(
        'SELECT id FROM orders WHERE renewal_for_code = ? AND is_renewal = 1 AND status = ?',
        [normalizedRenewalCode, 'pending']
      );
      if (pendingRows.length > 0) {
        return res.status(400).json({ success: false, error: '已有未完成的续费订单,请先完成或取消' });
      }
    } catch (err) {
      console.error('Renewal pre-check error:', err.message);
      return res.status(500).json({ success: false, error: '服务器错误' });
    }
    finalType = 'year'; // 强制 year,忽略前端传入的 type
  }

  if (!finalType) {
    return res.status(400).json({ success: false, error: '参数不完整' });
  }

  if (!PLAN_PRICES[finalType]) {
    return res.status(400).json({ success: false, error: '套餐类型无效' });
  }
  const numAmount = PLAN_PRICES[finalType];
  const subject = PLAN_SUBJECTS[finalType];

  // P0 安全修复：服务端生成订单号（crypto.randomBytes，CSPRNG），防止客户端可预测订单号导致激活码 IDOR
  const orderNo = 'CG' + crypto.randomBytes(12).toString('hex').toUpperCase();

  try {
    console.log('Creating WeChat Native pay order:', { orderNo, amount: numAmount, subject });

    // 金额转为分
    const totalFee = Math.round(numAmount * 100);

    // P1-5 修复：先入库创建 pending 订单，再调微信 API
    // 避免 API 成功 DB 失败导致用户已付款但订单不存在
    await pool.query(
      'INSERT INTO orders (order_no, plan, price, type, channel, status, user_email, is_renewal, renewal_for_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderNo, subject, numAmount, finalType, 'wechat', 'pending', email || null, normalizedRenewalCode ? 1 : 0, normalizedRenewalCode]
    );

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

    // P2-16 修复：添加 10 秒超时，避免 fetch 无限挂起
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(`${WECHAT_API_BASE}${urlPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
          'Accept': 'application/json',
        },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();
    // P3-8 修复：仅记录业务字段，不打印完整响应（可能含敏感信息）
    console.log('WeChat Native pay response: code_url=', !!data.code_url, 'has_error=', !!data.code);

    if (data.code_url) {
      res.json({
        success: true,
        codeUrl: data.code_url,  // 二维码链接
        orderNo,
      });
    } else {
      // P1-5 修复：API 返回错误，将订单标记为 cancelled
      await pool.query(
        'UPDATE orders SET status = ? WHERE order_no = ?',
        ['cancelled', orderNo]
      );
      // P3-8 修复：仅打印错误码和消息，不打印完整 data
      console.error('WeChat pay error: code=', data.code, 'message=', data.message);
      res.status(500).json({ success: false, error: '创建支付订单失败' });
    }
  } catch (error) {
    console.error('WeChat create order error:', error.message);
    // P1-5 修复：API 调用异常，将订单标记为 cancelled
    try {
      await pool.query(
        'UPDATE orders SET status = ? WHERE order_no = ?',
        ['cancelled', orderNo]
      );
    } catch (updateErr) {
      console.error('Failed to mark order as cancelled:', updateErr.message);
    }
    if (error.message === '微信支付私钥未配置') {
      res.status(503).json({ success: false, error: '微信支付尚未配置，请联系管理员' });
    } else {
      res.status(500).json({ success: false, error: '创建支付订单失败' });
    }
  }
});

// 查询订单状态
// P1-4 修复：激活码掩码返回 + IP 频率限制（与 alipay.js 保持一致）
router.get('/query-order/:orderNo', async (req, res) => {
  const { orderNo } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // P1-5 修复：orderNo 格式白名单校验，防止注入
  if (!/^[A-Za-z0-9\-]{1,64}$/.test(orderNo)) {
    return res.status(400).json({ success: false, error: '订单号格式无效' });
  }

  // P1-4 修复：基于 IP 的频率限制，防止枚举订单号窃取激活码
  const queryRateLimitKey = `query_order_wx_${ip}`;
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
    const [rows] = await pool.query(
      'SELECT status, activation_code, type, is_renewal FROM orders WHERE order_no = ?',
      [orderNo]
    );

    if (rows.length === 0) {
      return res.json({ paid: false, error: '订单不存在' });
    }

    const order = rows[0];
    const isPaid = order.status === 'completed';

    // 注意：激活码完整返回。落地页是用户获取激活码的唯一途径（前端未传 email，邮件发送不可用）。
    // P1-4 通过 IP 频率限制（20次/60秒）降低枚举风险。后续若启用邮件发送，可改为掩码返回。
    // 续费订单返回被续费的激活码,前端根据 isRenewal 区分显示
    res.json({
      paid: isPaid,
      status: order.status,
      activationCode: isPaid && order.activation_code ? order.activation_code : undefined,
      type: order.type,
      isRenewal: !!order.is_renewal,
    });
  } catch (error) {
    console.error('WeChat query order error:', error.message);
    res.json({ paid: false, error: '查询订单状态失败' });
  }
});

// 支付回调（微信支付异步通知）
// P1-2 修复：从 router 中提取为独立函数 handleNotify，在 index.js 中单独注册，
// 避免被 /api/wechat 下的全局限流（10次/分钟）覆盖导致回调被拒
const handleNotify = async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const body = JSON.parse(rawBody);

    // P3-8 修复：仅记录事件类型和 ID，不打印完整 body（含 payer openid 等敏感字段）
    console.log('WeChat notify received: event=', body.event_type, 'id=', body.id);

    // 验证签名（使用微信平台证书，而非商户证书）
    const timestamp = req.headers['wechatpay-timestamp'];
    const nonce = req.headers['wechatpay-nonce'];
    const signature = req.headers['wechatpay-signature'];
    const serial = req.headers['wechatpay-serial'];

    if (!timestamp || !nonce || !signature || !serial) {
      console.warn('WeChat notify: missing signature headers');
      return res.status(400).json({ code: 'FAIL', message: '缺少签名参数' });
    }

    // P1 安全修复：时间戳新鲜度校验（±5 分钟窗口），防止重放攻击
    const notifyTime = parseInt(timestamp);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(notifyTime) || Math.abs(nowSec - notifyTime) > 300) {
      console.warn('WeChat notify: timestamp out of window:', { notifyTime, nowSec, diff: nowSec - notifyTime });
      return res.status(400).json({ code: 'FAIL', message: '时间戳过期' });
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

    // P2 安全修复：日志脱敏，仅记录必要字段
    console.log('WeChat notify decrypted:', { out_trade_no: decrypted.out_trade_no, trade_state: decrypted.trade_state });

    const { out_trade_no, trade_state, transaction_id, amount: paidAmount, appid, mchid } = decrypted;

    if (trade_state === 'SUCCESS') {
      let conn;
      let dbFailed = false;
      try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [rows] = await conn.query(
          'SELECT id, status, price, type, user_email FROM orders WHERE order_no = ? FOR UPDATE',
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
          console.warn('wechat notify: appid/mchid mismatch (received does not match configured)');
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

        // 读取订单的 is_renewal 和 renewal_for_code
        const [orderRows] = await conn.query(
          'SELECT is_renewal, renewal_for_code FROM orders WHERE order_no = ?',
          [out_trade_no]
        );
        const orderInfo = orderRows[0];
        const isRenewalOrder = !!(orderInfo && orderInfo.is_renewal && orderInfo.renewal_for_code);
        let newPurchaseCode = null;

        if (isRenewalOrder) {
          // 续费分支:延期 license,不生成新激活码
          const [licRows] = await conn.query(
            'SELECT id, type, is_active, expires_at FROM licenses WHERE activation_code = ? FOR UPDATE',
            [orderInfo.renewal_for_code]
          );
          if (licRows.length > 0) {
            const lic = licRows[0];
            const now = new Date();
            const currentExpiry = lic.expires_at ? new Date(lic.expires_at) : now;
            const base = currentExpiry > now ? currentExpiry : now;
            const newExpiry = new Date(base);
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
            await conn.query(
              'UPDATE licenses SET expires_at = ?, is_active = TRUE, reminder_sent_at = NULL WHERE id = ?',
              [newExpiry, lic.id]
            );
            // orders.activation_code 写入被续费的激活码
            await conn.query(
              'UPDATE orders SET activation_code = ? WHERE order_no = ?',
              [orderInfo.renewal_for_code, out_trade_no]
            );
            console.log(`License renewed: ${orderInfo.renewal_for_code}, new expiry: ${newExpiry.toISOString()}`);
            // 续费成功邮件（异步,不阻塞）
            if (order.user_email) {
              try {
                const { sendRenewalSuccessEmail } = require('./mail');
                if (typeof sendRenewalSuccessEmail === 'function') {
                  sendRenewalSuccessEmail(order.user_email, {
                    activationCode: orderInfo.renewal_for_code,
                    newExpiresAt: newExpiry.toLocaleDateString('zh-CN'),
                    orderNo: out_trade_no
                  }).catch(err => console.error('续费邮件失败:', err.message));
                }
              } catch (err) {
                console.error('续费邮件加载失败:', err.message);
              }
            }
          } else {
            console.error('Renewal: license not found:', orderInfo.renewal_for_code);
          }
        } else {
          // 原有新购买分支:生成新激活码（与 admin.js /orders/:orderNo/complete 逻辑一致）
          const prefixMap = { year: 'YEAR', lifetime: 'PRO' };
          const prefix = prefixMap[order.type] || 'YEAR';
          newPurchaseCode = generateSecureCode(prefix);
          await conn.query(
            'INSERT INTO activation_codes (code, type, status, batch_id) VALUES (?, ?, ?, ?)',
            [newPurchaseCode, order.type || 'year', 'unused', generateBatchId()]
          );
          await conn.query(
            'UPDATE orders SET activation_code = ? WHERE id = ?',
            [newPurchaseCode, order.id]
          );
        }

        await conn.commit();
        console.log('WeChat order updated:', out_trade_no);

        // 异步发送激活码邮件（仅新购买分支,不阻塞回调响应）
        if (newPurchaseCode && order.user_email) {
          const planName = order.type === 'lifetime' ? '终身版' : '年付版';
          const expiresAt = order.type === 'lifetime' ? '永久有效' : new Date(Date.now() + 365 * 86400 * 1000).toLocaleDateString('zh-CN');
          sendActivationCodeEmail(order.user_email, {
            activationCode: newPurchaseCode,
            plan: planName,
            orderNo: out_trade_no,
            expiresAt,
          }).catch(err => console.error('发送激活码邮件失败:', err.message));
        }
      } catch (error) {
        if (conn) await conn.rollback();
        console.error('Update wechat order error:', error);
        // P0-2 修复：DB 事务失败，标记失败，让微信平台重试回调（不再返回 SUCCESS）
        dbFailed = true;
      } finally {
        if (conn) conn.release();
      }
      // P0-2 修复：事务失败时返回 500 FAIL，微信会重试；正常流程返回 SUCCESS
      if (dbFailed) {
        return res.status(500).json({ code: 'FAIL', message: 'internal error' });
      }
    }

    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('WeChat notify error:', error.message);
    res.status(500).json({ code: 'FAIL', message: '服务器内部错误' });
  }
};

// 导出 handleNotify 供 index.js 单独注册（绕过限流）
router.handleNotify = handleNotify;

module.exports = router;
