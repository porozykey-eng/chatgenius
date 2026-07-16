// PM2 进程管理配置
// 使用方式：pm2 start ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'chatgenius-api',
    script: 'index.js',
    cwd: __dirname,
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
