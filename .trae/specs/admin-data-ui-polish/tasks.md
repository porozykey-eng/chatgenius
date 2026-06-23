# Tasks

- [x] Task 1: 修复 Dashboard 收入统计数据准确性（`admin.js`）
  - [x] SubTask 1.1: 所有收入查询添加 `AND status = 'completed'` 确保排除退款订单（当前查询已使用 status='completed'，但需确认 completed_at 边界条件正确）
  - [x] SubTask 1.2: 所有 `parseFloat(xxx.total)` 改为 `parseFloat(xxx.total || 0)`，防止 NULL 产生 NaN
  - [x] SubTask 1.3: 渠道统计 `channelStats` 的 `total` 字段添加 `|| 0` 防护
  - [x] SubTask 1.4: Dashboard 响应中 `recentOrders` 的 `price` 字段添加 `|| '0'` 防护
  - [x] SubTask 1.5: `todayActivations`/`weekActivations` 等 COUNT 结果添加 `|| 0` 防护

- [x] Task 2: 修复订单统计接口数据准确性（`admin.js`）
  - [x] SubTask 2.1: `orders/statistics` 接口的 `channelBreakdown` 和 `typeBreakdown` 金额使用 `parseFloat(x || 0)` 防护
  - [x] SubTask 2.2: 确认 `orders` 列表接口的 `summary.amount` 使用 `COALESCE` 已正确处理 NULL
  - [x] SubTask 2.3: 订单详情中 `price` 字段确保返回有效数字

- [x] Task 3: UI 配色统一（`admin.html`）
  - [x] SubTask 3.1: Header 背景从 `linear-gradient(135deg, #4F46E5, #7C3AED)` 改为纯色 `#1a73e8`
  - [x] SubTask 3.2: CSS 变量 `--primary` 从 `#4F46E5` 改为 `#1a73e8`，`--primary-hover` 改为 `#1557b0`
  - [x] SubTask 3.3: 登录页面背景渐变同步改为蓝色系
  - [x] SubTask 3.4: `chart-btn.active` 和 `.tab.active` 使用新的 primary 色

- [x] Task 4: 移除 emoji 图标（`admin.html`）
  - [x] SubTask 4.1: 侧边栏 tab 按钮移除 emoji 前缀（📊🔑📦📋📝⚙️🔒），改用纯文字
  - [x] SubTask 4.2: Header `header-title::before { content: '🔧' }` 移除
  - [x] SubTask 4.3: Dashboard 统计卡片的 `stat-icon` 移除 emoji（💰💵💳💎🎯📈📋⚠️），改用 CSS 色块 + 文字缩写
  - [x] SubTask 4.4: 空状态 `empty::before { content: '📭' }` 移除 emoji
  - [x] SubTask 4.5: 登录页面标题中的 emoji 移除

- [x] Task 5: 文字可读性优化（`admin.html`）
  - [x] SubTask 5.1: `.stat-label` 颜色从 `var(--gray-500)` (#6b7280) 确认对比度达标，如不足改为 `var(--gray-600)` (#4b5563)
  - [x] SubTask 5.2: 表格 `th` 颜色从 `var(--gray-600)` 确认可读性
  - [x] SubTask 5.3: `.loading` 和 `.empty` 文字颜色从 `var(--gray-400)` (#9ca3af) 改为 `var(--gray-500)` (#6b7280)
  - [x] SubTask 5.4: 表格行高优化：`th, td` padding 从 `12px 16px` 调整为更合理的间距
  - [x] SubTask 5.5: `.card-title` 字号确认为 16px，字体权重 600
  - [x] SubTask 5.6: `.login-subtitle` 颜色从 `var(--gray-500)` 确认可读性

- [ ] Task 6: 提交、推送并验证
  - [ ] SubTask 6.1: git add + commit + push gitee
  - [ ] SubTask 6.2: 服务器 git pull + pm2 restart
  - [ ] SubTask 6.3: 访问管理后台验证所有改动

# Task Dependencies
- Task 3, 4, 5 可并行（均为前端 UI 修改）
- Task 1, 2 可并行（均为后端数据修复）
- Task 6 依赖 Task 1-5 全部完成
