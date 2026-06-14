#!/usr/bin/env node
/**
 * ChatGenius AI 一键启动脚本
 * 同时启动前端和后端开发服务器
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动 ChatGenius AI 开发环境...\n');

// 启动后端
console.log('📡 启动后端服务器...');
const server = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
});

// 等待后端启动
setTimeout(() => {
  // 启动前端
  console.log('🎨 启动前端开发服务器...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'landing-page'),
    stdio: 'inherit',
    shell: true,
  });

  frontend.on('error', (err) => {
    console.error('❌ 前端启动失败:', err);
  });

  console.log('\n✅ 前端已启动');
  console.log('\n📍 访问地址：');
  console.log('   前端: http://localhost:5181');
  console.log('   后端: http://localhost:3001\n');
}, 2000);

server.on('error', (err) => {
  console.error('❌ 后端启动失败:', err);
});

console.log('✅ 后端已启动\n');

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务...');
  server.kill();
  process.exit();
});
