# 常见问题

## API Key 在哪里找？

各服务商的 API Key 位置不同，但通常都在控制台的「API 密钥」或「API Keys」菜单下。

**通用查找路径**：

1. 登录服务商官网
2. 进入「控制台」或「管理后台」
3. 找到「API」或「密钥管理」相关菜单
4. 点击「创建 API Key」

具体路径见 [通用配置步骤 — 各厂商 API Key 入口](/guide/common-steps#各厂商-api-key-入口)。

## 测试连接失败怎么办？

### Key 无效（401 / 403）

- 检查 API Key 是否复制完整，注意不要多出空格
- 确认选择的「服务商」与 API Key 对应的服务商一致

### 余额不足（429）

- 登录服务商后台，在「费用中心」或「Billing」页面充值
- 部分服务商新用户有免费额度，可能已用完

### 网络超时

- 国内用户建议选择国内服务商，访问更稳定
- 国际服务商（OpenAI、Anthropic、Google）需要稳定的网络环境

### Key 权限不足

- 部分服务商需要单独开通 API 权限
- 检查 API Key 是否已过期或被禁用

## API Key 安全吗？

ChatGenius **不会上传你的 API Key**。Key 仅保存在浏览器本地（`chrome.storage.local`）。

安全建议：
- 不要将 API Key 分享给他人
- 定期检查服务商后台的用量，发现异常及时更换 Key
- 部分服务商支持设置 Key 的使用范围和额度限制

详见 [安全与隐私](/security)。

## 可以使用多家服务商吗？

ChatGenius 同时只配置一家服务商。如需切换，在设置页重新选择服务商并输入新的 API Key 即可。

如需同时访问多家模型，推荐使用 [OpenRouter](/providers/openrouter) — 一个 Key 访问所有主流模型。

## 如何查看用量和费用？

用量和费用由服务商管理，ChatGenius 本身不产生额外费用。登录服务商后台查看详细的调用记录和账单。

## ChatGenius 插件在哪里下载？

前往 [ChatGenius 官网](https://chat.sopie.cc) 下载最新版本的浏览器扩展。
