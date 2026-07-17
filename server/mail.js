// 邮件服务模块 - 用于发票通知等
// 依赖 nodemailer，需先 npm install nodemailer
const crypto = require('crypto');

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer 未安装，邮件功能不可用。请执行: npm install nodemailer');
}

let transporter = null;

// P3-8 修复：邮箱脱敏
function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '***';
  const [name, domain] = email.split('@');
  return (name.length <= 2 ? name[0] + '*' : name.substring(0, 2) + '***') + '@' + domain;
}

// P1-3 修复：HTML 转义工具函数，防止邮件模板 XSS
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * 初始化邮件 transporter
 * 需要在 .env 中配置 SMTP 相关变量
 */
function initTransporter() {
  if (!nodemailer) return null;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP 配置不完整，邮件功能不可用。请在 .env 中配置 SMTP_HOST, SMTP_USER, SMTP_PASS');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  console.log('✅ 邮件服务已初始化:', from);
  return transporter;
}

/**
 * 发送邮件
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - HTML 内容
 * @param {Array} attachments - 附件数组 [{filename, path}]
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendMail(to, subject, html, attachments = []) {
  if (!transporter) {
    initTransporter();
  }
  if (!transporter) {
    console.error('❌ 邮件服务未配置，无法发送邮件');
    return { success: false, error: '邮件服务未配置' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const info = await transporter.sendMail({
      from: `"ChatGenius" <${from}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log('✅ 邮件已发送:', info.messageId, '->', maskEmail(to));
    return { success: true };
  } catch (err) {
    console.error('❌ 邮件发送失败:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 发送发票开具通知邮件
 * @param {string} to - 收件人邮箱
 * @param {object} invoice - 发票信息 {title, orderNo, amount, invoiceUrl}
 */
async function sendInvoiceIssuedEmail(to, invoice) {
  // P1-3 修复：校验发票链接协议，仅允许 http/https
  const safeUrl = /^https?:\/\//.test(invoice.invoiceUrl) ? invoice.invoiceUrl : '#';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a73e8; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">ChatGenius 电子发票</h2>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 15px;">您好，您的发票申请已处理完成。</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 100px;">发票抬头</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 500;">${escapeHtml(invoice.title)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">订单号</td>
            <td style="padding: 8px 0; color: #111827;">${escapeHtml(invoice.orderNo)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">金额</td>
            <td style="padding: 8px 0; color: #111827;">¥${escapeHtml(parseFloat(invoice.amount).toFixed(2))}</td>
          </tr>
        </table>
        ${invoice.invoiceUrl ? `
          <a href="${escapeHtml(safeUrl)}" style="display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 8px;">下载发票</a>
        ` : ''}
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">如有疑问，请回复此邮件或联系 support@chatgenius.ai</p>
      </div>
    </div>
  `;

  const attachments = [];
  // 如果 invoiceUrl 是本地路径，可以作为附件发送
  // 这里暂只发送下载链接

  return sendMail(to, '【ChatGenius】您的电子发票已开具', html, attachments);
}

/**
 * 发送激活码邮件
 * @param {string} to - 收件人邮箱
 * @param {object} info - 激活码信息 { activationCode, plan, orderNo, expiresAt }
 */
async function sendActivationCodeEmail(to, info) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Hero -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:48px 40px 40px;text-align:center;">
              <div style="font-size:13px;font-weight:600;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">ChatGenius AI</div>
              <h1 style="margin:0;font-size:26px;font-weight:600;color:#ffffff;letter-spacing:-0.5px;">购买成功</h1>
              <div style="width:40px;height:2px;background:#4361ee;margin:20px auto 0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:500;">您好</p>
              <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.7;">
                感谢您购买 ChatGenius!请使用以下激活码完成产品激活。
              </p>

              <!-- 激活码卡片 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:28px;text-align:center;">
                    <div style="font-size:11px;font-weight:600;color:#4361ee;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">您的激活码</div>
                    <div style="font-family:'SF Mono',Monaco,Consolas,'Courier New',monospace;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:1px;word-break:break-all;">${escapeHtml(info.activationCode)}</div>
                  </td>
                </tr>
              </table>

              <!-- 订单信息 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:13px;color:#94a3b8;letter-spacing:0.5px;">套餐</span>
                    <span style="float:right;font-size:14px;color:#0f172a;font-weight:500;">${escapeHtml(info.plan)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:13px;color:#94a3b8;letter-spacing:0.5px;">订单号</span>
                    <span style="float:right;font-size:14px;color:#0f172a;font-family:'SF Mono',Monaco,monospace;">${escapeHtml(info.orderNo)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;">
                    <span style="font-size:13px;color:#94a3b8;letter-spacing:0.5px;">到期时间</span>
                    <span style="float:right;font-size:14px;color:#0f172a;font-weight:500;">${escapeHtml(info.expiresAt)}</span>
                  </td>
                </tr>
              </table>

              <!-- 激活步骤 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:16px;letter-spacing:0.5px;">激活步骤</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;line-height:1.6;"><span style="color:#4361ee;font-weight:600;">01</span> &nbsp;&nbsp;点击浏览器工具栏中的 ChatGenius 扩展图标</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;line-height:1.6;"><span style="color:#4361ee;font-weight:600;">02</span> &nbsp;&nbsp;进入扩展设置页面</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;line-height:1.6;"><span style="color:#4361ee;font-weight:600;">03</span> &nbsp;&nbsp;找到「激活产品」选项</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:14px;line-height:1.6;"><span style="color:#4361ee;font-weight:600;">04</span> &nbsp;&nbsp;粘贴激活码并确认</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">如有疑问,请回复此邮件或联系客服。</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">本邮件由 ChatGenius 系统自动发送<br>© 2026 ChatGenius AI · All rights reserved</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendMail(to, '【ChatGenius】您的激活码', html, []);
}

/**
 * 发送年付许可证即将到期提醒邮件
 * @param {string} to - 收件人邮箱
 * @param {object} info - 到期信息 { activationCode, expiresAt, renewUrl, price, qqGroup, qqGroupLink }
 */
async function sendExpiringReminderEmail(to, info) {
  // 安全：renewUrl 和 activationCode 用 escapeHtml 转义
  const safeRenewUrl = /^https?:\/\//.test(info.renewUrl) ? info.renewUrl : '#';
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Hero -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:48px 40px 40px;text-align:center;">
              <div style="font-size:13px;font-weight:600;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">ChatGenius AI</div>
              <h1 style="margin:0;font-size:26px;font-weight:600;color:#ffffff;letter-spacing:-0.5px;">许可证即将到期</h1>
              <div style="width:40px;height:2px;background:#f59e0b;margin:20px auto 0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:500;">您好</p>
              <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.7;">
                您的 ChatGenius 年付许可证即将到期,为避免服务中断,请及时续费。
              </p>

              <!-- 到期日期卡片 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:28px;text-align:center;">
                    <div style="font-size:11px;font-weight:600;color:#92400e;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">到期日期</div>
                    <div style="font-size:28px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">${escapeHtml(info.expiresAt)}</div>
                    <div style="font-size:13px;color:#78716c;margin-top:8px;">到期后将无法使用 AI 自动回复功能</div>
                  </td>
                </tr>
              </table>

              <!-- CTA 按钮 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td align="center;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(safeRenewUrl)}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="20%" fillcolor="#0f172a">
                      <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:600;">立即续费 ¥${escapeHtml(info.price)}/年</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${escapeHtml(safeRenewUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:16px 48px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.5px;">立即续费 ¥${escapeHtml(info.price)}/年</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- 续费权益 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;border-top:1px solid #f1f5f9;">
                <tr>
                  <td style="padding:24px 0;">
                    <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:16px;letter-spacing:0.5px;">续费权益</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">· 无限次 AI 自动回复</td></tr>
                      <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">· 14+ AI 模型自由切换</td></tr>
                      <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">· 自定义角色与知识库</td></tr>
                      <tr><td style="padding:7px 0;color:#64748b;font-size:14px;">· 优先客服支持</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 客服 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:6px;">需要帮助?</div>
                    <div style="font-size:13px;color:#64748b;line-height:1.6;">
                      QQ 群:${escapeHtml(info.qqGroup || '客服群')}${info.qqGroupLink ? ` · <a href="${escapeHtml(info.qqGroupLink)}" style="color:#4361ee;text-decoration:none;">点击加入</a>` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">本邮件由 ChatGenius 系统自动发送<br>如已续费,请忽略此邮件 · © 2026 ChatGenius AI</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendMail(to, '【ChatGenius】您的年付许可证即将到期', html, []);
}

/**
 * 发送续费成功通知邮件
 * @param {string} to - 收件人邮箱
 * @param {object} info - 续费信息 { activationCode, newExpiresAt, orderNo }
 */
async function sendRenewalSuccessEmail(to, info) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB',sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Hero -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:48px 40px 40px;text-align:center;">
              <div style="font-size:13px;font-weight:600;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">ChatGenius AI</div>
              <h1 style="margin:0;font-size:26px;font-weight:600;color:#ffffff;letter-spacing:-0.5px;">续费成功</h1>
              <div style="width:40px;height:2px;background:#10b981;margin:20px auto 0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:16px;color:#0f172a;font-weight:500;">您好</p>
              <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.7;">
                您的 ChatGenius 许可证已成功续费,以下是本次续费的详细信息。
              </p>

              <!-- 成功标识卡片 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#d1fae5;border:1px solid #a7f3d0;border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:28px;text-align:center;">
                    <div style="width:48px;height:48px;background:#10b981;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:24px;font-weight:700;line-height:1;">✓</div>
                    <div style="font-size:18px;font-weight:600;color:#065f46;margin-bottom:6px;">续费成功</div>
                    <div style="font-size:13px;color:#047857;">您的许可证已延期至 ${escapeHtml(info.newExpiresAt)}</div>
                  </td>
                </tr>
              </table>

              <!-- 订单信息 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:13px;color:#94a3b8;letter-spacing:0.5px;">激活码</span>
                    <span style="float:right;font-size:14px;color:#0f172a;font-family:'SF Mono',Monaco,Consolas,monospace;font-weight:500;">${escapeHtml(info.activationCode)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:13px;color:#94a3b8;letter-spacing:0.5px;">新到期时间</span>
                    <span style="float:right;font-size:14px;color:#0f172a;font-weight:500;">${escapeHtml(info.newExpiresAt)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;">
                    <span style="font-size:13px;color:#94a3b8;letter-spacing:0.5px;">订单号</span>
                    <span style="float:right;font-size:14px;color:#0f172a;font-family:'SF Mono',Monaco,monospace;">${escapeHtml(info.orderNo)}</span>
                  </td>
                </tr>
              </table>

              <!-- 重要提示 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border-left:3px solid #10b981;border-radius:0 12px 12px 0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:13px;font-weight:600;color:#065f46;margin-bottom:8px;letter-spacing:0.5px;">重要提示</div>
                    <div style="font-size:14px;color:#374151;line-height:1.7;">
                      无需重新激活,扩展程序会自动续期。如扩展未自动续期,请在扩展设置中点击「重新校验许可证」。
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">如有疑问,请回复此邮件或联系客服。</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">本邮件由 ChatGenius 系统自动发送,请勿直接回复<br>© 2026 ChatGenius AI · All rights reserved</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendMail(to, '【ChatGenius】续费成功通知', html, []);
}

module.exports = { sendMail, sendInvoiceIssuedEmail, sendActivationCodeEmail, sendExpiringReminderEmail, sendRenewalSuccessEmail, initTransporter };
