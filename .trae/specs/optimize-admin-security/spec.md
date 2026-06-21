# Admin 面板安全优化与数据准确性修复 Spec

## Why
Admin 面板存在多个安全漏洞（JWT 密钥弱、XSS、会话验证缺失）和数据准确性问题（周日统计归零、趋势图日期偏移、搜索功能失效），需要系统性修复。

## What Changes

### 安全优化
- URL 路径改为不可猜测的随机路径（如 `/admin-xxxx`）
- JWT 密钥强制使用随机 64 字符十六进制字符串，移除硬编码回退
- `requireAdmin` 中间件增加会话撤销状态检查
- 刷新令牌端点增加会话撤销检查
- XSS 防护：所有 `innerHTML` 动态数据使用 `escapeHtml()` 转义
- Chart.js CDN 增加 SRI 完整性校验
- 密码修改流程优化：不再返回哈希值到客户端
- CSV 导出改用 fetch + blob 下载，携带认证头
- `limit` 参数增加上限校验（最大 200）
- 移除明文密码比较回退路径

### 数据准确性修复
- **BREAKING**: 修复周日周统计归零问题（`getDay()` 返回 0 时的边界计算）
- 修复趋势图日期标签时区偏移（使用本地日期格式而非 `toISOString()`）
- 修复订单搜索参数不匹配（前端传 `search`，后端只接收 `orderNo`/`userEmail`）
- 修复 IP 白名单保存/加载循环断裂（数组/字符串类型不匹配）
- 修复订单汇总金额仅统计当前页而非全部查询结果
- 修复订单 CSV 导出按钮无功能（无事件监听、无后端端点）
- 修复趋势接口 N+1 查询问题（改为单次 GROUP BY 查询）
- 收入统计改用 SQL SUM 替代 JavaScript reduce
- 订单统计时间段边界与 Dashboard 保持一致

## Impact
- Affected specs: admin 面板、支付系统
- Affected code: `server/admin.js`, `server/admin.html`, `server/index.js`, `server/scripts/init-db.js`

## ADDED Requirements

### Requirement: Admin URL 混淆
系统 SHALL 使用不可猜测的随机路径替代 `/admin`，路径存储在 `.env` 中。

#### Scenario: 访问旧路径
- **WHEN** 用户访问 `/admin`
- **THEN** 返回 404

#### Scenario: 访问新路径
- **WHEN** 用户访问配置的随机路径
- **THEN** 返回 admin 页面

### Requirement: XSS 防护
系统 SHALL 对所有通过 `innerHTML` 插入的动态数据进行 HTML 转义。

#### Scenario: 恶意数据注入
- **WHEN** 数据库中存储了 `<script>alert(1)</script>` 类型的数据
- **THEN** 在 admin 面板中显示为纯文本，不执行脚本

### Requirement: 会话撤销验证
系统 SHALL 在每个认证请求中检查会话是否已被撤销。

#### Scenario: 已撤销会话的请求
- **WHEN** 管理员撤销了一个会话
- **THEN** 该会话的所有后续请求（包括刷新令牌）返回 401

## MODIFIED Requirements

### Requirement: JWT 密钥管理
JWT 密钥 SHALL 为随机 64 字符十六进制字符串，硬编码回退 SHALL 被移除。服务器启动时若未配置 SHALL 报错退出。

### Requirement: 密码修改流程
密码修改 SHALL 直接更新服务器配置，不再返回哈希值到客户端。

## REMOVED Requirements

### Requirement: 明文密码比较回退
**Reason**: 安全风险，强制使用 bcrypt 哈希
**Migration**: 确保 .env 中的 ADMIN_PASSWORD 为 bcrypt 哈希格式
