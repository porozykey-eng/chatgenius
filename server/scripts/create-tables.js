#!/usr/bin/env node
/**
 * LeanCloud 数据表初始化脚本
 * 自动创建所有必需的数据表
 * 
 * 使用方法：
 * 1. 配置 .env 文件中的 LEANCLOUD_APP_ID 和 LEANCLOUD_APP_KEY
 * 2. 运行：node scripts/create-tables.js
 */

require('dotenv').config();
const AV = require('leancloud-storage');

// 初始化 LeanCloud（国内版需要 serverURL）
AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_MASTER_KEY, // 需要 Master Key
  serverURL: 'https://avoscloud.com', // LeanCloud 国内版服务器地址
});

async function createTables() {
  console.log('🚀 开始创建 LeanCloud 数据表...\n');

  try {
    // 1. 创建 ActivationCode 表
    console.log('📋 创建 ActivationCode 表...');
    const ActivationCode = AV.Object.extend('ActivationCode');
    const code1 = new ActivationCode();
    code1.set('code', 'PRO-INIT-001');
    code1.set('type', 'lifetime');
    code1.set('status', 'unused');
    code1.set('createdAt', new Date());
    await code1.save();
    console.log('✅ ActivationCode 表创建成功\n');

    // 2. 创建 Order 表
    console.log('📋 创建 Order 表...');
    const Order = AV.Object.extend('Order');
    const order = new Order();
    order.set('orderNo', 'TEST-ORDER-001');
    order.set('plan', '测试订单');
    order.set('price', '0.00');
    order.set('type', 'lifetime');
    order.set('channel', 'alipay');
    order.set('status', 'pending');
    order.set('createdAt', new Date());
    await order.save();
    console.log('✅ Order 表创建成功\n');

    // 3. 创建 License 表
    console.log('📋 创建 License 表...');
    const License = AV.Object.extend('License');
    const license = new License();
    license.set('activationCode', 'PRO-INIT-001');
    license.set('type', 'lifetime');
    license.set('activatedAt', new Date());
    license.set('isActive', true);
    await license.save();
    console.log('✅ License 表创建成功\n');

    // 4. 创建 UserSettings 表
    console.log('📋 创建 UserSettings 表...');
    const UserSettings = AV.Object.extend('UserSettings');
    const settings = new UserSettings();
    settings.set('userEmail', 'test@example.com');
    settings.set('settings', {});
    settings.set('personas', []);
    settings.set('faqData', []);
    settings.set('lastSynced', new Date());
    await settings.save();
    console.log('✅ UserSettings 表创建成功\n');

    // 5. 创建 SupportTicket 表
    console.log('📋 创建 SupportTicket 表...');
    const SupportTicket = AV.Object.extend('SupportTicket');
    const ticket = new SupportTicket();
    ticket.set('userEmail', 'test@example.com');
    ticket.set('subject', '测试工单');
    ticket.set('description', '这是一个测试工单');
    ticket.set('category', 'technical');
    ticket.set('status', 'open');
    ticket.set('priority', 'medium');
    ticket.set('createdAt', new Date());
    ticket.set('updatedAt', new Date());
    await ticket.save();
    console.log('✅ SupportTicket 表创建成功\n');

    // 6. 创建 SupportMessage 表
    console.log('📋 创建 SupportMessage 表...');
    const SupportMessage = AV.Object.extend('SupportMessage');
    const message = new SupportMessage();
    message.set('ticketId', ticket.id);
    message.set('sender', 'user');
    message.set('senderEmail', 'test@example.com');
    message.set('message', '这是一条测试消息');
    message.set('createdAt', new Date());
    await message.save();
    console.log('✅ SupportMessage 表创建成功\n');

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    await code1.destroy();
    await order.destroy();
    await license.destroy();
    await settings.destroy();
    await ticket.destroy();
    await message.destroy();
    console.log('✅ 测试数据已清理\n');

    console.log('🎉 所有数据表创建成功！');
    console.log('\n请在 LeanCloud 控制台验证：');
    console.log('https://leancloud.cn/dashboard/data.html');

  } catch (error) {
    console.error('❌ 创建数据表失败:', error);
    process.exit(1);
  }
}

createTables();
