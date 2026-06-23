# License Anti-Piracy System - 验证清单

## 数据库扩展
- [ ] licenses 表有 device_fingerprint 字段
- [ ] licenses 表有 last_heartbeat 字段
- [ ] licenses 表有 unbind_count 字段
- [ ] licenses 表有 unbind_count_reset_at 字段
- [ ] licenses 表有 license_status 字段（active/locked/banned）
- [ ] activation_codes 表有 bound_fingerprint 字段
- [ ] ip_bans 表存在（id, ip, error_count, banned_until, created_at）

## 设备指纹生成
- [ ] 插件引入 FingerprintJS 开源版
- [ ] getDeviceFingerprint() 函数可生成指纹哈希
- [ ] 指纹缓存到 chrome.storage.local
- [ ] 激活时携带设备指纹参数

## 首次激活绑定
- [ ] POST /api/license/activate 接受 fingerprint 参数
- [ ] 激活码未绑定时，绑定当前设备指纹
- [ ] 激活码已绑定其他设备时，返回 needRebind: true
- [ ] 绑定后 activation_codes.bound_fingerprint 和 licenses.device_fingerprint 均写入

## 自助换绑（顶号）
- [ ] 换绑接口 POST /api/license/rebind 存在
- [ ] 换绑前检查 unbind_count < 2
- [ ] 换绑成功后 unbind_count +1
- [ ] 换绑成功后更新设备指纹
- [ ] unbind_count >= 2 时返回错误提示
- [ ] 跨自然月时 unbind_count 自动清零
- [ ] 插件端换绑确认弹窗显示剩余次数

## 心跳检测
- [ ] POST /api/license/heartbeat 接口存在
- [ ] 心跳校验指纹一致性
- [ ] 指纹一致时更新 last_heartbeat
- [ ] 指纹不一致返回 valid: false
- [ ] chrome.alarms 每 6 小时触发心跳
- [ ] 调用大模型 API 前验证（30 分钟缓存）
- [ ] 指纹不匹配时清空 licenseCode/apiKey/apiProvider
- [ ] 指纹不匹配时降级为 free
- [ ] 指纹不匹配时弹窗提示

## IP 限流防刷
- [ ] 错误激活码记录 IP 错误次数
- [ ] 累计 5 次错误封禁 IP 24 小时
- [ ] 封禁 IP 请求返回 429
- [ ] 封禁到期自动解封

## 防重放攻击
- [ ] 请求包含 timestamp 参数
- [ ] 请求包含 signature 参数（HMAC-SHA256）
- [ ] 后端校验 timestamp 与服务器时间差不超过 5 分钟
- [ ] 后端校验 signature 正确性
- [ ] 超时或签名错误返回 401
- [ ] .env.example 有 LICENSE_HMAC_SECRET 配置项

## 管理后台
- [ ] 许可证列表显示设备指纹（截断）
- [ ] 许可证列表显示最后心跳时间
- [ ] 许可证列表显示换绑次数
- [ ] 许可证列表显示状态（active/locked/banned）
- [ ] 许可证详情有"手动解绑"按钮
- [ ] 手动解绑不计入用户换绑次数
- [ ] IP 封禁管理页面存在
- [ ] 封禁列表显示 IP、错误次数、封禁到期时间
- [ ] 支持解封 IP

## 激活界面 Dark Mode
- [ ] 激活码输入区域为深色背景
- [ ] 文字为浅色
- [ ] 输入框为深色边框
- [ ] 按钮极简风格
- [ ] 整体克制专业（Apple/Linear 风格）

## manifest.json
- [ ] 新增 alarms 权限

## 功能回归
- [ ] 正常激活流程可用（首次绑定）
- [ ] 换绑流程可用（顶号）
- [ ] 心跳正常工作
- [ ] 老用户兼容（已激活的许可证首次心跳自动绑定）
- [ ] 管理员手动解绑可用
- [ ] IP 封禁和解封可用
