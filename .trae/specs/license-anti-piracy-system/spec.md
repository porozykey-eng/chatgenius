# 激活码防刷系统（License Anti-Piracy System）Spec

## Why
当前激活码系统存在严重盗版风险：激活码不绑定设备，用户购买后可分享给任意多人使用。本次升级引入设备指纹绑定、心跳检测、自助换绑（顶号）、IP 限流防刷等机制，实现一码一机的专业反盗版保护。

## 技术选型决策
- **设备指纹**：使用 FingerprintJS 开源版（MIT 免费），在插件端生成浏览器唯一指纹哈希
- **后端架构**：基于现有 MySQL + Express 实现，不引入 Supabase（避免增加架构复杂度和成本）
- **心跳机制**：使用 chrome.alarms API（需新增 alarms 权限），MV3 中 setInterval 不可靠
- **UI 风格**：激活码验证界面采用 Dark Mode 暗黑模式，Apple/Linear 极简工业风

## What Changes

### 数据库扩展
- **licenses 表新增字段**：`device_fingerprint`、`last_heartbeat`、`unbind_count`、`unbind_count_reset_at`、`license_status`
- **新增 ip_bans 表**：记录被封禁的 IP（IP、错误次数、封禁到期时间）
- **activation_codes 表新增字段**：`bound_fingerprint`（已绑定的设备指纹，未绑定为空）

### 插件端改造
- **引入 FingerprintJS**：生成浏览器设备指纹
- **激活流程改造**：激活时发送设备指纹，后端绑定
- **心跳检测**：chrome.alarms 每 6 小时心跳一次 + 每次调用大模型 API 前验证指纹
- **指纹不匹配处理**：立即清空本地 licenseCode、apiKey 等敏感信息，降级为 free
- **换绑确认 UI**：检测到已绑定其他设备时，弹窗提示"是否强制在此设备登录？本月剩余换绑次数：X"
- **激活界面 Dark Mode**：Apple/Linear 极简工业风暗黑模式

### 后端 API 改造
- **POST /api/license/activate**：增加设备指纹参数，支持首次绑定和换绑逻辑
- **POST /api/license/heartbeat**：新增心跳接口，验证指纹一致性
- **IP 限流**：同一 IP 连续 5 次错误激活码 → 封禁 24 小时
- **防重放攻击**：激活请求加时间戳 + HMAC 签名校验
- **每月清零**：心跳时检查并清零 unbind_count

### 管理后台
- **许可证列表**：显示设备指纹、最后心跳时间、换绑次数、状态
- **手动解绑**：管理员可手动解绑设备（不计入用户换绑次数）
- **封禁管理**：查看/解封 IP 封禁列表

## Impact
- Affected code:
  - `server/license.js` — 激活/心跳/验证逻辑全面改造
  - `server/scripts/init-db.js` — 表结构扩展
  - `server/admin.js` — 许可证管理增加设备信息、IP 封禁管理
  - `server/admin.html` — 许可证列表增加设备列、新增封禁管理
  - `options.html` — 激活码界面 Dark Mode 重构
  - `options.js` — 引入 FingerprintJS、激活流程改造、心跳逻辑
  - `background.js` — chrome.alarms 心跳、指纹不匹配处理
  - `manifest.json` — 新增 alarms 权限
  - `package.json`（插件端）— 新增 @fingerprintjs/fingerprintjs 依赖

## ADDED Requirements

### Requirement: 设备指纹生成
插件 SHALL 使用 FingerprintJS 开源版生成浏览器唯一设备指纹哈希值。

#### Scenario: 指纹生成
- **WHEN** 插件加载或激活时需要设备指纹
- **THEN** 调用 FingerprintJS 生成指纹，缓存到 chrome.storage.local
- **AND** 指纹为字符串类型（如 "a1b2c3d4e5f6..."）

### Requirement: 首次激活绑定
插件读取用户输入的激活码和当前设备指纹，发送给后端。后端验证码有效且未绑定后，将激活码与设备指纹绑定。

#### Scenario: 首次激活成功
- **WHEN** 用户输入有效激活码，且该激活码未绑定任何设备
- **THEN** 后端将 device_fingerprint 写入 activation_codes 和 licenses 表
- **AND** 返回激活成功，许可证类型（year/lifetime）

#### Scenario: 激活码已绑定其他设备
- **WHEN** 用户输入的激活码已绑定其他设备指纹（与当前设备不同）
- **THEN** 后端检查本月 unbind_count < 2
- **AND** 返回 `{ needRebind: true, remainingCount: X }` 提示换绑
- **AND** 插件弹窗"该激活码已在其他设备使用，是否强制在此设备登录？本月剩余换绑次数：X"

### Requirement: 自助换绑（顶号）
用户确认换绑后，后端更新设备指纹为新指纹，unbind_count +1，老设备下次心跳时被踢下线。

#### Scenario: 换绑成功
- **WHEN** 用户确认换绑且本月 unbind_count < 2
- **THEN** 后端更新 activation_codes.bound_fingerprint 和 licenses.device_fingerprint 为新指纹
- **AND** licenses.unbind_count +1
- **AND** 返回激活成功

#### Scenario: 换绑次数耗尽
- **WHEN** 本月 unbind_count >= 2
- **THEN** 返回错误"本月换绑次数已用完，请下月再试或联系客服"

#### Scenario: 每月自动清零
- **WHEN** 心跳或激活时检测到 unbind_count_reset_at 跨越了自然月
- **THEN** unbind_count 重置为 0，unbind_count_reset_at 更新为当前时间

### Requirement: 心跳检测
插件运行期间定期向后端发送心跳，核对设备指纹一致性。

#### Scenario: 定时心跳
- **WHEN** chrome.alarms 触发（每 6 小时）
- **THEN** 插件发送 `{ code, fingerprint, timestamp, signature }` 到 `/api/license/heartbeat`
- **AND** 后端核对指纹一致则更新 last_heartbeat，返回 `{ valid: true }`
- **AND** 指纹不一致则返回 `{ valid: false, reason: 'device_mismatch' }`

#### Scenario: 调用 API 前验证
- **WHEN** 插件每次调用大模型 API 前
- **THEN** 先发送心跳验证（可缓存 30 分钟内的验证结果，避免频繁请求）

#### Scenario: 指纹不匹配踢下线
- **WHEN** 心跳返回 `valid: false`
- **THEN** 插件立即清空 chrome.storage 中的 licenseCode、licenseType、apiKey、apiProvider
- **AND** 设置 licenseType 为 'free'
- **AND** 弹窗提示"检测到该激活码已在其他设备使用，本设备已自动退出"

### Requirement: IP 限流防刷
激活码验证接口必须做 IP 限流，防止暴力穷举。

#### Scenario: 错误次数累计
- **WHEN** 同一 IP 提交错误激活码
- **THEN** 记录错误次数到 ip_bans 表
- **AND** 累计达 5 次时，封禁该 IP 24 小时

#### Scenario: IP 已封禁
- **WHEN** 已封禁 IP 再次请求激活接口
- **THEN** 返回 429 状态码"该 IP 因多次错误尝试已被暂时封禁，请 24 小时后再试"

### Requirement: 防重放攻击
插件与后端的验证通信加时间戳校验。

#### Scenario: 时间戳校验
- **WHEN** 插件发送激活/心跳请求
- **THEN** 请求包含 `timestamp`（当前时间戳）和 `signature`（HMAC-SHA256(code + timestamp, SECRET)）
- **AND** 后端校验 timestamp 与服务器时间差不超过 5 分钟
- **AND** 后端校验 signature 正确
- **AND** 超时或签名错误返回 401

### Requirement: 激活界面 Dark Mode
激活码验证界面采用 Dark Mode 暗黑模式，Apple/Linear 极简工业风。

#### Scenario: 视觉风格
- **WHEN** 用户查看激活码输入区域
- **THEN** 背景为深色（#0d1117 或类似）
- **AND** 文字为浅色，输入框为深色边框
- **AND** 按钮为极简风格，无多余装饰
- **AND** 整体克制、专业

## MODIFIED Requirements

### Requirement: 激活码激活流程
激活时 SHALL 携带设备指纹，支持首次绑定和换绑两种情况。

### Requirement: 许可证验证
verify-token 接口 SHALL 额外校验设备指纹一致性。

### Requirement: 管理后台许可证列表
许可证列表 SHALL 显示设备指纹（截断显示）、最后心跳时间、换绑次数、状态（active/locked/banned）。

## REMOVED Requirements

### Requirement: 无设备绑定的激活
**Reason**: 旧系统激活码不绑定设备，存在盗版风险
**Migration**: 现有已激活的许可证在首次心跳时自动绑定当前设备指纹
