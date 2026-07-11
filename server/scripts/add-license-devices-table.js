// 迁移脚本：新增 license_devices 设备池表 + 风控字段 + 老数据迁移
// 使用方法: node scripts/add-license-devices-table.js
// 兼容性：自动补全 licenses 表缺失的字段（device_fingerprint/last_heartbeat/unbind_count 等）
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

  // 所有 ALTER 都用 try-catch 容错（ER_DUP_FIELDNAME 表示已存在，跳过）
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

    // 2. IP 封禁表（防刷系统依赖）
    `CREATE TABLE IF NOT EXISTS ip_bans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ip VARCHAR(45) NOT NULL,
      error_count INT NOT NULL DEFAULT 1,
      banned_until TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ip (ip),
      INDEX idx_banned_until (banned_until)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 3. licenses 表补全字段：设备指纹（兼容早期未加的情况）
    `ALTER TABLE licenses ADD COLUMN device_fingerprint VARCHAR(64) NULL`,
    `ALTER TABLE licenses ADD COLUMN last_heartbeat TIMESTAMP NULL`,
    `ALTER TABLE licenses ADD COLUMN unbind_count INT NOT NULL DEFAULT 0`,
    `ALTER TABLE licenses ADD COLUMN unbind_count_reset_at TIMESTAMP NULL`,

    // 4. 风控字段：换绑暂停截止时间 + 最近换绑时间
    `ALTER TABLE licenses ADD COLUMN rebind_paused_until TIMESTAMP NULL`,
    `ALTER TABLE licenses ADD COLUMN last_rebind_at TIMESTAMP NULL`,

    // 5. activation_codes 表补全 bound_fingerprint（兼容早期未加的情况）
    `ALTER TABLE activation_codes ADD COLUMN bound_fingerprint VARCHAR(64) NULL`,
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

  // 6. 迁移老数据：将已有 device_fingerprint 的 license 同步到 license_devices
  // 容错：逐字段探测，缺失则用 NULL/默认值
  try {
    // 先探测 licenses 表实际有哪些列
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'licenses'`
    );
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));

    const selectCols = [
      'l.id',
      'l.activation_code',
      'l.activated_at',
      colSet.has('device_fingerprint') ? 'l.device_fingerprint' : 'NULL AS device_fingerprint',
      colSet.has('last_heartbeat') ? 'l.last_heartbeat' : 'NULL AS last_heartbeat',
    ];

    const [oldLicenses] = await pool.query(
      `SELECT ${selectCols.join(', ')}
       FROM licenses l
       WHERE l.device_fingerprint IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM license_devices ld
           WHERE ld.license_id = l.id AND ld.device_fingerprint = l.device_fingerprint
         )`
    );

    let migrated = 0;
    for (const lic of oldLicenses) {
      await pool.query(
        `INSERT INTO license_devices (license_id, activation_code, device_fingerprint, first_seen_at, last_heartbeat_at, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [lic.id, lic.activation_code, lic.device_fingerprint, lic.activated_at || new Date(), lic.last_heartbeat || null]
      );
      migrated++;
    }
    console.log(`✅ 迁移老数据：${migrated} 条设备记录已同步到 license_devices`);
  } catch (err) {
    console.error('❌ 老数据迁移失败:', err.message);
    console.error('   （表结构探测失败，可忽略——新表已创建，后续新激活会正常写入设备池）');
  }

  await pool.end();
  console.log('\n🎉 迁移完成！');
}

migrate().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});
