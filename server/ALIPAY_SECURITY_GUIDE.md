# 支付宝密钥生成指南

## 方法一：使用支付宝密钥生成工具（推荐）

1. 下载支付宝官方密钥生成工具：
   - Windows: https://opendocs.alipay.com/common/02kipk
   - Mac: https://opendocs.alipay.com/common/02kipl

2. 打开工具，选择：
   - 密钥长度：**RSA2 (2048 位)** - 必须选这个！
   - 密钥格式：**PKCS1 (非 Java 适用)**

3. 点击"生成密钥"

4. 保存以下三个密钥：
   - **应用公钥** (public_key.pem) - 需要上传到支付宝开放平台
   - **应用私钥** (private_key.pem) - **绝对不要泄露！**
   - **支付宝公钥** - 在支付宝开放平台获取

## 方法二：使用 OpenSSL 命令行生成

```bash
# 生成私钥
openssl genrsa -out private_key.pem 2048

# 生成公钥
openssl rsa -in private_key.pem -pubout -out public_key.pem

# 查看私钥（用于配置）
cat private_key.pem

# 查看公钥（上传到支付宝）
cat public_key.pem
```

## 安全注意事项

### ⚠️ 绝对不要做的事

1. **不要将私钥提交到 Git**
   - 确保 `server/.env` 在 `.gitignore` 中
   - 私钥只保存在服务器本地

2. **不要在客户端代码中使用私钥**
   - 所有支付签名必须在后端完成
   - 前端只接收支付二维码

3. **不要使用测试密钥上线**
   - 开发阶段使用沙箱环境
   - 上线前必须更换为正式密钥

### ✅ 必须做的事

1. **使用 HTTPS**
   - 生产环境必须配置 SSL 证书
   - 使用 Let's Encrypt 免费证书或阿里云 SSL

2. **配置 IP 白名单**
   - 在支付宝开放平台设置服务器 IP
   - 只允许自己的服务器调用支付 API

3. **定期轮换密钥**
   - 建议每 6-12 个月更换一次密钥
   - 更换前先在支付宝平台配置新公钥

4. **启用异步通知验证**
   - 必须验证支付宝回调签名
   - 使用支付宝公钥验证（不是应用公钥）

## 配置流程

### 1. 在支付宝开放平台配置

1. 登录 https://open.alipay.com
2. 进入"应用管理" -> 你的应用
3. 点击"接口加密方式"
4. 设置"加密模式"为"公钥"
5. 粘贴你生成的**应用公钥**内容（去掉首尾注释）
6. 保存后，支付宝会生成**支付宝公钥**

### 2. 配置环境变量

编辑 `server/.env`：

```env
# 支付宝配置
ALIPAY_APP_ID=2021000000000000  # 从支付宝开放平台获取
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"  # 你的私钥（完整内容）
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0B...\n-----END PUBLIC KEY-----"  # 支付宝公钥
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do  # 正式环境
# ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do  # 沙箱环境（测试用）
```

### 3. 沙箱环境测试（开发阶段）

1. 访问：https://openhome.alipay.com/develop/sandbox/app
2. 沙箱应用已有默认配置
3. 下载"沙箱版支付宝" App 进行支付测试
4. 使用沙箱账号登录测试

## 生产部署检查清单

- [ ] 使用正式环境密钥（非沙箱）
- [ ] 配置 HTTPS
- [ ] 设置 IP 白名单
- [ ] 验证异步通知签名
- [ ] 测试支付流程完整闭环
- [ ] 配置支付失败重试机制
- [ ] 记录支付日志（不包含敏感信息）
- [ ] 设置支付金额上限（防刷）
- [ ] 配置支付超时取消订单

## 常见问题

### Q: 私钥格式问题？
A: 私钥应该是完整的多行 PEM 格式，包含 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`

### Q: 签名验证失败？
A: 检查：
1. 使用的是 RSA2（2048 位）密钥
2. 支付宝公钥是从开放平台复制的（不是应用公钥）
3. 私钥格式正确，没有多余空格

### Q: 如何验证配置是否成功？
A: 运行后端服务器后访问：
```bash
curl http://localhost:3001/health
```
然后尝试调用支付接口看是否返回正确错误信息
