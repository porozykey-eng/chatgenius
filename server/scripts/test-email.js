/**
 * 邮件发送测试脚本
 * 用法: node scripts/test-email.js <邮箱地址>
 * 例如: node scripts/test-email.js chat@sopie.cc
 *
 * 发送两封测试邮件:
 * 1. 到期提醒邮件 (sendExpiringReminderEmail)
 * 2. 续费成功邮件 (sendRenewalSuccessEmail)
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const { initTransporter, sendExpiringReminderEmail, sendRenewalSuccessEmail } = require('../mail');

async function main() {
  const to = process.argv[2] || 'chat@sopie.cc';
  console.log(`正在初始化邮件传输器...`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '(未配置)'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 465}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || '(未配置)'}`);
  console.log(`SMTP_FROM: ${process.env.SMTP_FROM || '(未配置)'}`);
  console.log(`SITE_BASE_URL: ${process.env.SITE_BASE_URL || 'https://chat.sopie.cc'}`);
  console.log('');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP 配置不完整,请检查 .env 文件中的 SMTP_HOST/SMTP_USER/SMTP_PASS');
    process.exit(1);
  }

  try {
    initTransporter();
    console.log('✓ 邮件传输器初始化成功');
  } catch (err) {
    console.error('❌ 邮件传输器初始化失败:', err.message);
    process.exit(1);
  }

  const baseUrl = process.env.SITE_BASE_URL || 'https://chat.sopie.cc';

  // 测试 1: 到期提醒邮件
  console.log('');
  console.log('===== 测试 1: 发送到期提醒邮件 =====');
  try {
    const result1 = await sendExpiringReminderEmail(to, {
      activationCode: 'YEAR-TEST2026-ABCD',
      expiresAt: '2026年7月22日',
      renewUrl: `${baseUrl}/?renew=YEAR-TEST2026-ABCD`,
      price: '68',
      qqGroup: '123456789',
      qqGroupLink: 'https://qm.qq.com/q/testgroup'
    });
    if (result1 && result1.success) {
      console.log(`✓ 到期提醒邮件发送成功 → ${to}`);
      console.log(`  MessageId: ${result1.messageId || '(无)'}`);
    } else {
      console.error('❌ 到期提醒邮件发送失败:', result1 && result1.error);
    }
  } catch (err) {
    console.error('❌ 到期提醒邮件发送异常:', err.message);
  }

  // 测试 2: 续费成功邮件
  console.log('');
  console.log('===== 测试 2: 发送续费成功邮件 =====');
  try {
    const result2 = await sendRenewalSuccessEmail(to, {
      activationCode: 'YEAR-TEST2026-ABCD',
      newExpiresAt: '2027年7月22日',
      orderNo: 'TEST-ORDER-20260717-001'
    });
    if (result2 && result2.success) {
      console.log(`✓ 续费成功邮件发送成功 → ${to}`);
      console.log(`  MessageId: ${result2.messageId || '(无)'}`);
    } else {
      console.error('❌ 续费成功邮件发送失败:', result2 && result2.error);
    }
  } catch (err) {
    console.error('❌ 续费成功邮件发送异常:', err.message);
  }

  console.log('');
  console.log('===== 测试完成 =====');
  console.log(`请检查邮箱: ${to}`);
  console.log('(如果收件箱没收到,请检查垃圾邮件文件夹)');
  process.exit(0);
}

main().catch(err => {
  console.error('未捕获异常:', err);
  process.exit(1);
});
