// 到期邮件提醒定时任务 Worker
// 由 PM2 cron_restart 每天触发，扫描即将到期的年付许可证并发送提醒邮件
// 使用 MySQL GET_LOCK 防止多实例并发执行
require('dotenv').config();

const { pool } = require('./config');
const { sendExpiringReminderEmail, initTransporter } = require('./mail');

const LOCK_NAME = 'cron_reminder_lock';

async function run() {
  let conn = null;
  let lockAcquired = false;

  try {
    conn = await pool.getConnection();

    // 1. 获取锁，防止并发执行（获取不到直接退出）
    const [lockRows] = await conn.query('SELECT GET_LOCK(?, 0) AS lock_status', [LOCK_NAME]);
    const lockStatus = lockRows[0] && lockRows[0].lock_status;
    if (lockStatus !== 1) {
      console.log('⚠️ 无法获取锁 %s，可能已有其他实例在运行，退出', LOCK_NAME);
      conn.release();
      await pool.end();
      process.exit(0);
    }
    lockAcquired = true;
    console.log('✅ 已获取锁 %s', LOCK_NAME);

    // 2. 初始化邮件 transporter
    initTransporter();

    // 3. 查询即将到期的年付许可证（到期前 5 天）
    const [licenses] = await conn.query(`
      SELECT id, activation_code, user_email, expires_at, type
      FROM licenses
      WHERE is_active = 1
        AND type = 'year'
        AND expires_at IS NOT NULL
        AND expires_at <= DATE_ADD(NOW(), INTERVAL 5 DAY)
        AND expires_at > NOW()
        AND (reminder_sent_at IS NULL OR reminder_sent_at < DATE_SUB(expires_at, INTERVAL 360 DAY))
    `);

    console.log('📋 共查询到 %d 条即将到期的年付许可证', licenses.length);

    if (licenses.length === 0) {
      console.log('✅ 无需发送提醒邮件');
      return;
    }

    // 4. 查询 system_settings 获取价格和客服联系方式（一次性查询）
    const [settings] = await conn.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('pricing.year', 'contact.qqGroup', 'contact.qqGroupLink')"
    );
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

    const price = settingsMap['pricing.year'] || '';
    const qqGroup = settingsMap['contact.qqGroup'] || '';
    const qqGroupLink = settingsMap['contact.qqGroupLink'] || '';
    const baseUrl = process.env.SITE_BASE_URL || 'https://chat.sopie.cc';

    // 5. 逐条发送提醒邮件
    let successCount = 0;
    let failCount = 0;

    for (const license of licenses) {
      // 无 user_email 跳过
      if (!license.user_email) {
        console.log('⏭️ license id=%s 无 user_email，跳过', license.id);
        continue;
      }

      const renewUrl = `${baseUrl}/?renew=${license.activation_code}`;
      const info = {
        activationCode: license.activation_code,
        expiresAt: license.expires_at ? new Date(license.expires_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '',
        renewUrl,
        price,
        qqGroup,
        qqGroupLink,
      };

      try {
        const result = await sendExpiringReminderEmail(license.user_email, info);
        if (result && result.success) {
          // 发送成功后更新 reminder_sent_at
          await conn.query('UPDATE licenses SET reminder_sent_at = NOW() WHERE id = ?', [license.id]);
          console.log('✅ 已发送提醒邮件到 license id=%s', license.id);
          successCount++;
        } else {
          console.error('❌ 发送失败 license id=%s:', license.id, result && result.error);
          failCount++;
          // 发送失败不更新 reminder_sent_at，下次 cron 重试
        }
      } catch (err) {
        console.error('❌ 发送异常 license id=%s:', license.id, err.message);
        failCount++;
        // 发送失败不更新 reminder_sent_at，下次 cron 重试
      }
    }

    console.log('📊 完成：成功 %d，失败 %d', successCount, failCount);
  } catch (err) {
    console.error('❌ cron-worker 执行异常:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    // 6. 释放锁
    if (lockAcquired && conn) {
      try {
        await conn.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]);
        console.log('🔓 已释放锁 %s', LOCK_NAME);
      } catch (e) {
        console.error('释放锁失败:', e.message);
      }
    }
    if (conn) {
      try { conn.release(); } catch (e) {}
    }
    try {
      await pool.end();
    } catch (e) {}
    process.exit(0);
  }
}

run().catch(err => {
  console.error('❌ 未捕获异常:', err.message);
  console.error(err.stack);
  process.exit(1);
});
