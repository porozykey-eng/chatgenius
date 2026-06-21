// 添加支付相关字段到 orders 表
const { pool } = require('../config');

async function migrate() {
  try {
    // 添加 alipay_trade_no 字段
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS alipay_trade_no VARCHAR(64) DEFAULT NULL
    `);
    console.log('✅ Added alipay_trade_no column');

    // 添加 wechat_trade_no 字段
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS wechat_trade_no VARCHAR(64) DEFAULT NULL
    `);
    console.log('✅ Added wechat_trade_no column');

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
