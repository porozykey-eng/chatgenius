// ChatGenius AI Backend - 密码哈希生成脚本
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('用法: node hash-password.js <密码>');
  process.exit(1);
}

const saltRounds = 12;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n密码哈希值:');
console.log(hash);
console.log('\n请将此值复制到 .env 文件的 ADMIN_PASSWORD 变量中');
console.log('示例: ADMIN_PASSWORD=' + hash);
