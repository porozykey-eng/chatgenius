# Tasks

- [x] Task 1: 数据库扩展 — licenses 表新增字段 + ip_bans 表（`server/scripts/`）
  - [x] SubTask 1.1: 新建迁移脚本 `add-license-security-fields.js`，为 licenses 表添加 `device_fingerprint VARCHAR(64)`、`last_heartbeat TIMESTAMP NULL`、`unbind_count INT DEFAULT 0`、`unbind_count_reset_at TIMESTAMP NULL`、`license_status ENUM('active','locked','banned') DEFAULT 'active'`
  - [x] SubTask 1.2: 为 activation_codes 表添加 `bound_fingerprint VARCHAR(64) DEFAULT NULL`
  - [x] SubTask 1.3: 新建 ip_bans 表（`id, ip, error_count, banned_until, created_at`）

- [x] Task 2: 后端 — 激活流程改造（`server/license.js`）
  - [x] SubTask 2.1: POST /activate 增加设备指纹参数，支持首次绑定
  - [x] SubTask 2.2: 检测已绑定其他设备时返回 `{ needRebind: true, remainingCount }`
  - [x] SubTask 2.3: 新增 POST /rebind 接口处理换绑确认（更新指纹、unbind_count+1、每月清零）
  - [x] SubTask 2.4: 激活码错误时记录 IP 错误次数，达 5 次封禁 24 小时
  - [x] SubTask 2.5: 请求时间戳 + HMAC 签名校验（防重放）

- [x] Task 3: 后端 — 心跳接口（`server/license.js`）
  - [x] SubTask 3.1: 新增 POST /heartbeat 接口，校验指纹一致性
  - [x] SubTask 3.2: 指纹一致则更新 last_heartbeat，检查并清零 unbind_count（跨月）
  - [x] SubTask 3.3: 指纹不一致返回 `{ valid: false, reason: 'device_mismatch' }`
  - [x] SubTask 3.4: verify-token 接口增加指纹校验

- [x] Task 4: 后端 — 管理后台扩展（`server/admin.js`）
  - [x] SubTask 4.1: GET /licenses 列表返回设备指纹、心跳时间、换绑次数、状态
  - [x] SubTask 4.2: 新增 POST /licenses/:id/unbind 手动解绑接口（不计入用户换绑次数）
  - [x] SubTask 4.3: 新增 GET /ip-bans 封禁列表接口
  - [x] SubTask 4.4: 新增 POST /ip-bans/:id/unban 解封接口

- [x] Task 5: 后端 — 签名密钥配置（`server/.env.example`）
  - [x] SubTask 5.1: 新增 LICENSE_HMAC_SECRET 配置项（≥32 字符随机字符串）

- [x] Task 6: 插件 — 设备指纹生成器（`fingerprint.js`）
  - [x] SubTask 6.1: 新建 fingerprint.js 基于原生 API（Navigator/Screen/Canvas/WebGL/Audio）生成指纹（CSP限制不使用外部库）
  - [x] SubTask 6.2: 新增 getDeviceFingerprint() 函数，缓存到 chrome.storage.local
  - [x] SubTask 6.3: 激活时携带设备指纹和签名

- [x] Task 7: 插件 — 激活流程改造（`options.js` + `options.html`）
  - [x] SubTask 7.1: 激活请求增加 fingerprint、timestamp、signature 参数
  - [x] SubTask 7.2: 处理 needRebind 响应，弹窗确认换绑
  - [x] SubTask 7.3: 换绑确认后调用 /rebind 接口
  - [x] SubTask 7.4: 激活界面 Dark Mode 样式重构（Apple/Linear 极简工业风，GitHub 配色体系）

- [x] Task 8: 插件 — 心跳检测（`background.js` + `manifest.json`）
  - [x] SubTask 8.1: manifest.json 新增 alarms 权限 + notifications 权限
  - [x] SubTask 8.2: chrome.alarms 每 6 小时触发心跳
  - [x] SubTask 8.3: 每次调用大模型 API 前验证（缓存 30 分钟）
  - [x] SubTask 8.4: 指纹不匹配时清空 licenseCode/apiKey/apiProvider，降级 free，桌面通知

- [x] Task 9: 管理后台 UI — 许可证列表扩展 + 封禁管理（`server/admin.html`）
  - [x] SubTask 9.1: 许可证列表新增设备指纹、心跳时间、换绑次数、状态列
  - [x] SubTask 9.2: 许可证详情增加"手动解绑"按钮
  - [x] SubTask 9.3: 新增 IP 封禁管理页面（列表 + 解封）

- [x] Task 10: 提交、推送并验证
  - [x] SubTask 10.1: git add + commit + push gitee（commit 3809d96）
  - [ ] SubTask 10.2: 服务器部署 + 数据库迁移 + 功能验证（待用户执行）

# Task Dependencies
- Task 1 是所有后端任务的基础（Task 2, 3, 4 依赖表结构）
- Task 5 依赖 Task 2（签名密钥供激活接口使用）
- Task 6 是插件端基础（Task 7, 8 依赖指纹生成）
- Task 2, 3 可并行（激活和心跳独立）
- Task 4 依赖 Task 1（管理后台需要新字段）
- Task 7 依赖 Task 2, 6（激活流程需要后端接口和指纹）
- Task 8 依赖 Task 3, 6（心跳需要后端接口和指纹）
- Task 9 依赖 Task 4（UI 需要后端接口）
- Task 10 依赖 Task 1-9 全部完成
