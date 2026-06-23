// 创建发票申请表 invoice_requests
const { pool } = require('../config');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(64) NOT NULL,
        invoice_type ENUM('personal', 'company') NOT NULL,
        title VARCHAR(200) NOT NULL,
        tax_number VARCHAR(30) DEFAULT NULL,
        email VARCHAR(200) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'issued', 'rejected') DEFAULT 'pending',
        invoice_url VARCHAR(500) DEFAULT NULL,
        remark TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        issued_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_order (order_no),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Created invoice_requests table');

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
