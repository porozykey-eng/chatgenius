// 激活码防刷系统 - 数据库迁移脚本
// 为 licenses 表新增设备指纹相关字段，为 activation_codes 表新增绑定指纹字段，新建 ip_bans 表
const { pool } = require('../config');

async function migrate() {
  try {
    // 1. licenses 表新增字段
    const licenseFields = [
      'ALTER TABLE licenses ADD COLUMN device_fingerprint VARCHAR(64) DEFAULT NULL',
      'ALTER TABLE licenses ADD COLUMN last_heartbeat TIMESTAMP NULL DEFAULT NULL',
      'ALTER TABLE licenses ADD COLUMN unbind_count INT NOT NULL DEFAULT 0',
      'ALTER TABLE licenses ADD COLUMN unbind_count_reset_at TIMESTAMP NULL DEFAULT NULL',
      "ALTER TABLE licenses ADD COLUMN license_status ENUM('active','locked','banned') NOT NULL DEFAULT 'active'",
    ];

    for (const sql of licenseFields) {
      try {
        await pool.query(sql);
        console.log('✅', sql.substring(0, 60));
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log('⏭️  字段已存在，跳过:', e.message.split("'")[1]);
        } else {
          throw e;
        }
      }
    }

    // 2. activation_codes 表新增 bound_fingerprint 字段
    try {
      await pool.query('ALTER TABLE activation_codes ADD COLUMN bound_fingerprint VARCHAR(64) DEFAULT NULL');
      console.log('✅ activation_codes.bound_fingerprint 已添加');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  bound_fingerprint 已存在，跳过');
      } else {
        throw e;
      }
    }

    // 3. 新建 ip_bans 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ip_bans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL,
        error_count INT NOT NULL DEFAULT 0,
        banned_until TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ip (ip),
        INDEX idx_banned_until (banned_until)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ ip_bans 表已创建');

    console.log('\n迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

migrate();
