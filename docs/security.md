# 安全与隐私

ChatGenius AI 将用户隐私和数据安全放在首位。

## API Key 存储

你的 API Key **仅保存在浏览器本地**（`chrome.storage.local`），不会上传到 ChatGenius 的任何服务器。

这意味着：
- 只有你自己的浏览器可以访问该 Key
- ChatGenius 团队无法查看或使用你的 Key
- 清除浏览器数据会删除已保存的 Key

## 数据传输

ChatGenius 与 AI 服务商之间的通信通过 HTTPS 加密传输。API 请求直接从你的浏览器发送到服务商的 API 端点，不经过 ChatGenius 的中间服务器。

## 安全建议

- **不要分享 API Key** — 即使对方声称是官方客服
- **定期查看用量** — 在服务商后台检查调用记录，发现异常及时更换 Key
- **设置额度限制** — 部分服务商支持设置 Key 的每日消费上限
- **及时更新插件** — 保持 ChatGenius 为最新版本，获取安全补丁

## 权限说明

ChatGenius 浏览器扩展所需的权限：

| 权限 | 用途 |
|------|------|
| `storage` | 本地存储 API Key 和设置 |
| `activeTab` | 读取当前页面内容以生成回复 |
| `alarms` | 后台定时任务 |
| `notifications` | 显示操作结果通知 |

## 联系我们

如有安全相关问题，请发送邮件至 [support@chatgenius.ai](mailto:support@chatgenius.ai)。
