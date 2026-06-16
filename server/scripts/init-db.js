// ChatGenius AI Backend - MySQL 数据库初始化脚本
// 使用方法: node scripts/init-db.js
require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

async function initDatabase() {
  console.log('🚀 开始初始化 MySQL 数据库...\n');

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'chatgenius',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'chatgenius',
    charset: 'utf8mb4',
  });

  const tables = [
    // 激活码表
    `CREATE TABLE IF NOT EXISTS activation_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      type VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'unused',
      batch_id VARCHAR(50),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      used_at TIMESTAMP NULL,
      INDEX idx_code (code),
      INDEX idx_status (status),
      INDEX idx_type (type),
      INDEX idx_batch_id (batch_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 订单表
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_no VARCHAR(50) UNIQUE NOT NULL,
      plan VARCHAR(50) NOT NULL,
      price VARCHAR(20) NOT NULL,
      type VARCHAR(20) NOT NULL,
      channel VARCHAR(20) NOT NULL DEFAULT 'alipay',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      activation_code VARCHAR(50),
      user_email VARCHAR(255),
      alipay_trade_no VARCHAR(100),
      refund_reason TEXT,
      refunded_at TIMESTAMP NULL,
      INDEX idx_order_no (order_no),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 许可证表
    `CREATE TABLE IF NOT EXISTS licenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      activation_code VARCHAR(50) NOT NULL,
      type VARCHAR(20) NOT NULL,
      user_email VARCHAR(255),
      activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      INDEX idx_activation_code (activation_code),
      INDEX idx_user_email (user_email),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 管理员会话表
    `CREATE TABLE IF NOT EXISTS admin_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(64) UNIQUE NOT NULL,
      ip VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked TINYINT(1) NOT NULL DEFAULT 0,
      INDEX idx_session_id (session_id),
      INDEX idx_revoked (revoked)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 审计日志表
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      admin_ip VARCHAR(45),
      user_agent TEXT,
      method VARCHAR(10),
      path VARCHAR(500),
      details TEXT,
      target_id VARCHAR(100),
      target_type VARCHAR(50),
      before_state TEXT,
      after_state TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 系统设置表
    `CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
    try {
      await pool.query(sql);
      console.log(`✅ 表 ${tableName} 创建成功`);
    } catch (err) {
      console.error(`❌ 表 ${tableName} 创建失败:`, err.message);
    }
  }

  // 插入默认系统设置
  const defaultSettings = [
    ['pricing.year', '68'],
    ['pricing.lifetime', '98'],
    ['site.name', 'ChatGenius AI'],
  ];

  for (const [key, value] of defaultSettings) {
    try {
      await pool.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = setting_value',
        [key, value]
      );
      console.log(`✅ 默认设置 ${key} = ${value}`);
    } catch (err) {
      console.error(`❌ 设置 ${key} 失败:`, err.message);
    }
  }

  await pool.end();
  console.log('\n🎉 数据库初始化完成！');
}

initDatabase().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});
