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

// === 套餐价格集中管理(单一数据源,避免多文件默认值不一致)===
// 所有模块必须从此处引用,禁止在各文件中独立定义默认值
const PLAN_PRICES = {
  year: Number(process.env.PRICE_YEAR || 99),
  lifetime: Number(process.env.PRICE_LIFETIME || 299),
};
const PLAN_SUBJECTS = {
  year: process.env.PLAN_SUBJECT_YEAR || 'ChatGenius AI 浏览器扩展-年付版',
  lifetime: process.env.PLAN_SUBJECT_LIFETIME || 'ChatGenius AI 浏览器扩展-永久版',
};

module.exports = { pool, PLAN_PRICES, PLAN_SUBJECTS };
