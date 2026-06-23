// 邮件服务模块 - 用于发票通知等
// 依赖 nodemailer，需先 npm install nodemailer
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer 未安装，邮件功能不可用。请执行: npm install nodemailer');
}

let transporter = null;

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
    console.log('✅ 邮件已发送:', info.messageId, '->', to);
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
            <td style="padding: 8px 0; color: #111827; font-weight: 500;">${invoice.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">订单号</td>
            <td style="padding: 8px 0; color: #111827;">${invoice.orderNo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">金额</td>
            <td style="padding: 8px 0; color: #111827;">¥${parseFloat(invoice.amount).toFixed(2)}</td>
          </tr>
        </table>
        ${invoice.invoiceUrl ? `
          <a href="${invoice.invoiceUrl}" style="display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 8px;">下载发票</a>
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

module.exports = { sendMail, sendInvoiceIssuedEmail, initTransporter };
