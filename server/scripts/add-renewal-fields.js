// 迁移脚本：到期邮件提醒功能所需的字段
// 使用方法: node scripts/add-renewal-fields.js
// 新增字段：
//   licenses.reminder_sent_at TIMESTAMP NULL（记录上次发送到期提醒时间，防止重复发送）
//   orders.is_renewal TINYINT(1) NOT NULL DEFAULT 0（标记订单是否为续费订单）
//   orders.renewal_for_code VARCHAR(50) NULL（续费订单关联的原激活码）
require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'chatgenius',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'chatgenius',
    charset: 'utf8mb4',
  });

  console.log('Adding renewal reminder fields...');

  // 1. licenses 表新增 reminder_sent_at 字段
  try {
    await pool.query('ALTER TABLE licenses ADD COLUMN reminder_sent_at TIMESTAMP NULL');
    console.log('✓ licenses.reminder_sent_at column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠ licenses.reminder_sent_at column already exists');
    } else {
      console.log('licenses.reminder_sent_at:', e.message);
    }
  }

  // 2. licenses.reminder_sent_at 索引
  try {
    await pool.query('ALTER TABLE licenses ADD INDEX idx_reminder_sent_at (reminder_sent_at)');
    console.log('✓ licenses.reminder_sent_at index added');
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME') {
      console.log('⚠ licenses.reminder_sent_at index already exists');
    } else {
      console.log('licenses.reminder_sent_at index:', e.message);
    }
  }

  // 3. orders 表新增 is_renewal 字段
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN is_renewal TINYINT(1) NOT NULL DEFAULT 0');
    console.log('✓ orders.is_renewal column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠ orders.is_renewal column already exists');
    } else {
      console.log('orders.is_renewal:', e.message);
    }
  }

  // 4. orders.is_renewal 索引
  try {
    await pool.query('ALTER TABLE orders ADD INDEX idx_is_renewal (is_renewal)');
    console.log('✓ orders.is_renewal index added');
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME') {
      console.log('⚠ orders.is_renewal index already exists');
    } else {
      console.log('orders.is_renewal index:', e.message);
    }
  }

  // 5. orders 表新增 renewal_for_code 字段
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN renewal_for_code VARCHAR(50) NULL');
    console.log('✓ orders.renewal_for_code column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠ orders.renewal_for_code column already exists');
    } else {
      console.log('orders.renewal_for_code:', e.message);
    }
  }

  // 6. orders.renewal_for_code 索引
  try {
    await pool.query('ALTER TABLE orders ADD INDEX idx_renewal_for_code (renewal_for_code)');
    console.log('✓ orders.renewal_for_code index added');
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME') {
      console.log('⚠ orders.renewal_for_code index already exists');
    } else {
      console.log('orders.renewal_for_code index:', e.message);
    }
  }

  await pool.end();
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
