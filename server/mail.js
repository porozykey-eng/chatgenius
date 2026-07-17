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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #4361ee; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">ChatGenius 激活码</h2>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 15px;">您好，感谢您购买 ChatGenius！以下是您的激活码：</p>

        <div style="text-align: center; background: #ffffff; border: 2px dashed #4361ee; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; color: #4361ee; letter-spacing: 2px; word-break: break-all;">${escapeHtml(info.activationCode)}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 100px;">套餐类型</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 500;">${escapeHtml(info.plan)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">订单号</td>
            <td style="padding: 8px 0; color: #111827;">${escapeHtml(info.orderNo)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">到期时间</td>
            <td style="padding: 8px 0; color: #111827;">${escapeHtml(info.expiresAt)}</td>
          </tr>
        </table>

        <div style="background: #eff6ff; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; color: #1e40af; font-weight: 600; font-size: 14px;">激活步骤：</p>
          <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
            <li>点击浏览器工具栏中的 ChatGenius 扩展图标</li>
            <li>进入扩展设置页面</li>
            <li>找到「激活产品」选项</li>
            <li>将上方激活码粘贴到输入框中并确认</li>
          </ol>
        </div>

        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">如有疑问，请回复此邮件或联系 support@chatgenius.ai</p>
      </div>
    </div>
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a73e8; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">ChatGenius AI 到期提醒</h2>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 15px;">您好，您的 ChatGenius 年付许可证即将到期。</p>
        <p style="color: #374151; font-size: 15px;">到期日期：<strong style="color: #dc2626;">${escapeHtml(info.expiresAt)}</strong></p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${escapeHtml(safeRenewUrl)}" style="display: inline-block; background: #1a73e8; color: white; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">立即续费</a>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">当前到期时间</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 500;">${escapeHtml(info.expiresAt)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">续费价格</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 500;">¥${escapeHtml(info.price)} / 年</td>
          </tr>
        </table>

        <div style="background: #eff6ff; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; color: #1e40af; font-weight: 600; font-size: 14px;">需要帮助？</p>
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
            加入 QQ 群：${escapeHtml(info.qqGroup || '客服群')}${info.qqGroupLink ? `（<a href="${escapeHtml(info.qqGroupLink)}" style="color: #1a73e8;">点击加入</a>）` : ''}
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">本邮件由系统自动发送，如已续费请忽略。</p>
      </div>
    </div>
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">ChatGenius 续费成功</h2>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 15px;">您好，您的 ChatGenius 许可证已成功续费！</p>

        <div style="text-align: center; background: #ffffff; border: 2px dashed #16a34a; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; color: #16a34a; letter-spacing: 2px; word-break: break-all;">${escapeHtml(info.activationCode)}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">新到期时间</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 500;">${escapeHtml(info.newExpiresAt)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">订单号</td>
            <td style="padding: 8px 0; color: #111827;">${escapeHtml(info.orderNo)}</td>
          </tr>
        </table>

        <div style="background: #f0fdf4; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #166534; font-weight: 600; font-size: 14px;">重要提示：</p>
          <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px; line-height: 1.6;">
            无需重新激活，扩展程序会自动续期。如扩展未自动续期，请在扩展设置中点击「重新校验许可证」。
          </p>
        </div>

        <div style="background: #eff6ff; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 14px;">需要帮助？</p>
          <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px; line-height: 1.6;">
            如有疑问，请回复此邮件或联系客服。
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">本邮件由系统自动发送，请勿直接回复。</p>
      </div>
    </div>
  `;

  return sendMail(to, '【ChatGenius】续费成功通知', html, []);
}

module.exports = { sendMail, sendInvoiceIssuedEmail, sendActivationCodeEmail, sendExpiringReminderEmail, sendRenewalSuccessEmail, initTransporter };
