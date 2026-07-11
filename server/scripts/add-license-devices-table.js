// 迁移脚本：新增 license_devices 设备池表 + 风控字段
// 使用方法: node scripts/add-license-devices-table.js
require('dotenv').config({ path: __dirname + '/../.env' });
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('🚀 开始迁移：设备池 + 风控字段...\n');

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'chatgenius',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'chatgenius',
    charset: 'utf8mb4',
  });

  const migrations = [
    // 1. 设备池表：一个激活码可绑定多台设备
    `CREATE TABLE IF NOT EXISTS license_devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      license_id INT NOT NULL,
      activation_code VARCHAR(50) NOT NULL,
      device_fingerprint VARCHAR(64) NOT NULL,
      device_name VARCHAR(200),
      first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_heartbeat_at TIMESTAMP NULL,
      last_ip VARCHAR(45),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      INDEX idx_license_id (license_id),
      INDEX idx_activation_code (activation_code),
      INDEX idx_fingerprint (device_fingerprint),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 2. licenses 表新增风控字段：换绑暂停截止时间（异常换绑触发）
    `ALTER TABLE licenses ADD COLUMN rebind_paused_until TIMESTAMP NULL`,

    // 3. licenses 表新增字段：最近换绑时间（用于"换绑后1小时原设备再激活"风控）
    `ALTER TABLE licenses ADD COLUMN last_rebind_at TIMESTAMP NULL`,
  ];

  for (const sql of migrations) {
    const desc = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)|ALTER TABLE (\w+) ADD COLUMN (\w+)/);
    const name = desc ? (desc[1] || `${desc[2]}.${desc[3]}`) : 'unknown';
    try {
      await pool.query(sql);
      console.log(`✅ ${name} 创建/添加成功`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`⏭️  ${name} 已存在，跳过`);
      } else {
        console.error(`❌ ${name} 失败:`, err.message);
      }
    }
  }

  // 4. 迁移老数据：将已有 device_fingerprint 的 license 同步到 license_devices
  try {
    const [oldLicenses] = await pool.query(
      `SELECT l.id, l.activation_code, l.device_fingerprint, l.last_heartbeat
       FROM licenses l
       WHERE l.device_fingerprint IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM license_devices ld
           WHERE ld.license_id = l.id AND ld.device_fingerprint = l.device_fingerprint
         )`
    );

    for (const lic of oldLicenses) {
      await pool.query(
        `INSERT INTO license_devices (license_id, activation_code, device_fingerprint, first_seen_at, last_heartbeat_at, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [lic.id, lic.activation_code, lic.device_fingerprint, lic.activated_at || new Date(), lic.last_heartbeat]
      );
    }
    console.log(`✅ 迁移老数据：${oldLicenses.length} 条设备记录已同步到 license_devices`);
  } catch (err) {
    console.error('❌ 老数据迁移失败:', err.message);
  }

  await pool.end();
  console.log('\n🎉 迁移完成！');
}

migrate().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});
