// ChatGenius AI Backend - MySQL 数据库配置
const mysql = require('mysql2/promise');

// 创建连接池
// P1-11 修复：connectionLimit 提升到 20，queueLimit 设为 100（fail-fast），
// 增加连接超时与 keepAlive，避免连接队列无限堆积拖垮进程
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'chatgenius',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'chatgenius',
  waitForConnections: true,
  charset: 'utf8mb4',
  connectionLimit: 20,
  queueLimit: 100,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL 数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL 数据库连接失败:', err.message);
  });

module.exports = { pool };
