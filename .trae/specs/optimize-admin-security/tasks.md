# Tasks

- [x] Task 1: URL 路径混淆与基础安全加固
  - [x] SubTask 1.1: 修改 `server/index.js` 中 admin 路由，从 `.env` 读取随机路径（如 `ADMIN_ROUTE=/admin-a7x9k2`），旧路径 `/admin` 返回 404
  - [x] SubTask 1.2: 修改 `server/admin.js`，移除 JWT 密钥硬编码回退，启动时检查 `JWT_SECRET` 必须存在且长度 >= 32
  - [x] SubTask 1.3: 生成新的强随机 JWT 密钥，更新 `.env.example`

- [x] Task 2: 会话安全强化
  - [x] SubTask 2.1: 修改 `requireAdmin` 中间件，查询数据库检查 `revoked` 状态，已撤销会话返回 401
  - [x] SubTask 2.2: 修改 `/refresh-token` 端点，检查会话撤销状态
  - [x] SubTask 2.3: 移除明文密码比较回退路径，强制 bcrypt

- [x] Task 3: XSS 防护
  - [x] SubTask 3.1: 在 `admin.html` 中添加 `escapeHtml()` 工具函数
  - [x] SubTask 3.2: 对所有 `innerHTML` 中的动态数据应用 `escapeHtml()` 转义
  - [x] SubTask 3.3: Chart.js CDN 添加 SRI `integrity` 和 `crossorigin` 属性

- [x] Task 4: 密码修改流程优化
  - [x] SubTask 4.1: 修改 `admin.js` 密码修改端点，将新哈希直接写入 `.env` 文件（或环境变量）
  - [x] SubTask 4.2: 修改 `admin.html` 密码修改逻辑，不再 alert 哈希值，改为提示重启服务

- [x] Task 5: CSV 导出修复
  - [x] SubTask 5.1: 修改 `admin.html` 中 CSV 导出逻辑，改用 `fetch` + `Blob` 下载，携带 Authorization 头
  - [x] SubTask 5.2: 新增 `/orders/export` 后端端点（参考 `/codes/export` 实现）
  - [x] SubTask 5.3: 绑定 `#exportOrdersBtn` 事件监听器

- [x] Task 6: 数据准确性修复 - 统计与趋势
  - [x] SubTask 6.1: 修复周日周统计归零（`getDay() === 0` 时使用 -6 天偏移）
  - [x] SubTask 6.2: 收入统计改用 SQL `SUM(CAST(price AS DECIMAL))` 替代 JS reduce
  - [x] SubTask 6.3: 修复趋势图日期标签时区偏移（使用本地日期格式）
  - [x] SubTask 6.4: 趋势接口改为单次 GROUP BY 查询，消除 N+1 问题
  - [x] SubTask 6.5: 修复 `limit` 参数上限（最大 200）

- [x] Task 7: 数据准确性修复 - 搜索与汇总
  - [x] SubTask 7.1: 修复订单搜索参数不匹配（后端增加 `search` 参数，支持订单号/邮箱模糊搜索）
  - [x] SubTask 7.2: 修复订单汇总金额：改为独立 COUNT/SUM 查询，不受分页影响
  - [x] SubTask 7.3: 修复 IP 白名单保存/加载（存储时 JSON.stringify，读取时 JSON.parse）
  - [x] SubTask 7.4: 订单统计时间段边界与 Dashboard 日历周/月保持一致

# Task Dependencies
- Task 2 depends on Task 1 (JWT 密钥变更后会话验证才有意义)
- Task 4 depends on Task 2 (密码修改需要认证中间件正常工作)
- Task 5 depends on Task 1 (导出需要正确的认证路径)
- Task 6 and Task 7 are independent and can be parallelized
