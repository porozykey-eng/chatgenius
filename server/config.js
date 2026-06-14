// ChatGenius AI Backend - 配置文件
const AV = require('leancloud-storage');

// 初始化 LeanCloud（仅执行一次）
AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  serverURL: 'https://avoscloud.com', // LeanCloud 国内版服务器地址
});

module.exports = { AV };
