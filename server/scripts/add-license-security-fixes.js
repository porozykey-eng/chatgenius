// 迁移脚本：许可证安全修复所需的唯一约束 + ip_bans 补字段
// 使用方法: node scripts/add-license-security-fixes.js
// 对应修复：
//   P1-6 license_devices (license_id, device_fingerprint) 唯一约束
//   P1-6 licenses.activation_code 唯一约束
//   P0-3 ip_bans.ip 唯一约束（原子 upsert 依赖）+ last_error_at 字段
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

  console.log('Adding unique constraints...');

  // 0. ip_bans 补 last_error_at 字段（recordActivationError 原子 upsert 依赖）
  try {
    await pool.query('ALTER TABLE ip_bans ADD COLUMN last_error_at TIMESTAMP NULL');
    console.log('✓ ip_bans.last_error_at column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠ ip_bans.last_error_at column already exists');
    } else {
      console.log('ip_bans.last_error_at:', e.message);
    }
  }

  // 1. license_devices 唯一约束
  try {
    await pool.query('ALTER TABLE license_devices ADD UNIQUE KEY uk_license_fingerprint (license_id, device_fingerprint)');
    console.log('✓ license_devices unique constraint added');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      console.log('⚠ license_devices unique constraint already exists or duplicate data found');
    } else {
      console.log('license_devices:', e.message);
    }
  }

  // 2. licenses.activation_code 唯一约束
  try {
    await pool.query('ALTER TABLE licenses ADD UNIQUE KEY uk_activation_code (activation_code)');
    console.log('✓ licenses.activation_code unique constraint added');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      console.log('⚠ licenses.activation_code unique constraint already exists or duplicate data found');
    } else {
      console.log('licenses.activation_code:', e.message);
    }
  }

  // 3. ip_bans.ip 唯一约束（用于 P0-3 原子 upsert）
  try {
    await pool.query('ALTER TABLE ip_bans ADD UNIQUE KEY uk_ip (ip)');
    console.log('✓ ip_bans.ip unique constraint added');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      console.log('⚠ ip_bans.ip unique constraint already exists or duplicate data found');
    } else {
      console.log('ip_bans.ip:', e.message);
    }
  }

  await pool.end();
  console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
