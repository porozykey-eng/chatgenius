# ChatGenius AI 国内商业化部署指南

## 目录

1. [本地开发环境](#本地开发环境)
2. [LeanCloud 配置](#leancloud-配置)
3. [支付宝支付集成](#支付宝支付集成)
4. [生产环境部署](#生产环境部署)
5. [常见问题](#常见问题)

---

## 本地开发环境

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 快速启动

```bash
# 1. 安装依赖
npm install  # 在项目根目录执行

# 2. 配置环境变量
# 编辑 server/.env 和 landing-page/.env

# 3. 一键启动（前端 + 后端）
node start-dev.js
```

### 分别启动

```bash
# 启动后端（终端 1）
cd server
npm run dev

# 启动前端（终端 2）
cd landing-page
npm run dev
```

**访问地址**：
- 前端：http://localhost:5180
- 后端：http://localhost:3000

---

## LeanCloud 配置

### 1. 注册账号

1. 访问 https://leancloud.cn
2. 注册并完成实名认证
3. 创建应用：ChatGenius AI

### 2. 获取凭证

进入应用 → 设置 → 应用凭证，获取：
- **App ID**
- **App Key**
- **Master Key**（仅后端使用）

### 3. 配置环境变量

**server/.env**：
```env
LEANCLOUD_APP_ID=your-app-id
LEANCLOUD_APP_KEY=your-app-key
LEANCLOUD_MASTER_KEY=your-master-key
```

**landing-page/.env**：
```env
VITE_LEANCLOUD_APP_ID=your-app-id
VITE_LEANCLOUD_APP_KEY=your-app-key
```

### 4. 初始化数据表

```bash
cd server
npm run init-db
```

脚本会自动创建以下表：
- ActivationCode（激活码）
- Order（订单）
- License（许可证）
- UserSettings（用户设置）
- SupportTicket（客服工单）
- SupportMessage（工单消息）

### 5. 验证

访问 https://leancloud.cn/dashboard/data.html 查看数据表是否创建成功。

---

## 支付宝支付集成

### 1. 申请当面付

**前提条件**：
- 企业营业执照
- 法人身份证
- 对公银行账户

**申请流程**：

1. 访问 https://opendocs.alipay.com/open/270/106123
2. 注册企业账号
3. 创建应用
4. 申请"当面付"能力
5. 提交资质审核（3-7 个工作日）

### 2. 生成 RSA2 密钥

**Windows**：
```bash
# 使用 OpenSSL（需安装）
openssl genrsa -out app_private_key.pem 2048
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

**Mac/Linux**：
```bash
# 系统自带 OpenSSL
openssl genrsa -out app_private_key.pem 2048
openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
```

### 3. 配置支付宝

1. 登录支付宝开放平台
2. 进入应用 → 开发信息 → 接口加签方式
3. 选择"公钥"模式
4. 上传 `app_public_key.pem`
5. 获取**支付宝公钥**

### 4. 配置环境变量

**server/.env**：
```env
ALIPAY_APP_ID=your-app-id
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

**注意**：密钥需要保留换行符 `\n`

### 5. 沙箱测试

如果还未获得正式权限，可使用沙箱环境：

1. 访问 https://openhome.alipay.com/develop/sandbox/app
2. 获取沙箱 App ID 和密钥
3. 修改 `ALIPAY_GATEWAY`：
   ```env
   ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
   ```
4. 下载沙箱版支付宝扫码支付

---

## 生产环境部署

### 后端部署（阿里云 ECS）

#### 1. 购买服务器

- 推荐配置：1 核 1G
- 系统：Ubuntu 20.04
- 费用：约 ¥50/月

#### 2. 安装 Node.js

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node --version
npm --version
```

#### 3. 上传代码

```bash
# 本地打包
cd server
tar -czf server.tar.gz .

# 上传到服务器
scp server.tar.gz root@your-server-ip:/opt/chatgenius

# SSH 登录服务器
ssh root@your-server-ip
cd /opt/chatgenius
tar -xzf server.tar.gz
```

#### 4. 安装依赖并启动

```bash
cd /opt/chatgenius
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入真实值

# 使用 PM2 管理进程
npm install -g pm2
pm2 start index.js --name chatgenius-api
pm2 save
pm2 startup

# 查看状态
pm2 status
pm2 logs chatgenius-api
```

#### 5. 配置 Nginx 反向代理

```bash
# 安装 Nginx
apt-get install nginx -y

# 配置
nano /etc/nginx/sites-available/chatgenius
```

**配置内容**：
```nginx
server {
    listen 80;
    server_name api.chatgenius.cn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**启用配置**：
```bash
ln -s /etc/nginx/sites-available/chatgenius /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 前端部署（阿里云 OSS）

#### 1. 构建

```bash
cd landing-page

# 修改 .env 中的 API URL
VITE_API_URL=https://api.chatgenius.cn

# 构建
npm run build
```

#### 2. 上传到 OSS

1. 登录阿里云 OSS 控制台
2. 创建 Bucket（公开读）
3. 使用 ossutil 上传：

```bash
# 安装 ossutil
# https://help.aliyun.com/document_detail/120075.html

# 上传
ossutil cp -r dist/ oss://your-bucket-name/
```

#### 3. 配置自定义域名

1. 在 OSS 控制台绑定域名
2. 配置 CDN 加速
3. 开启 HTTPS

---

## 常见问题

### Q: LeanCloud 免费版额度够吗？

A: 初期完全够用：
- API 请求：30,000 次/天
- 数据存储：100MB
- 文件存储：500MB

当用户超过 1000 时，考虑升级到专业版（¥150/月）

### Q: 支付宝审核被拒绝怎么办？

A: 常见原因：
1. 营业执照不清晰 → 重新上传高清扫描件
2. 网站无 ICP 备案 → 先完成备案
3. 应用功能描述不清 → 详细说明功能

### Q: 本地测试正常，部署后无法访问？

A: 检查：
1. 服务器防火墙是否开放 3000 端口
2. 阿里云安全组是否配置
3. Nginx 配置是否正确
4. 域名 DNS 是否解析正确

### Q: 如何查看后端日志？

A: 
```bash
# PM2 日志
pm2 logs chatgenius-api

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Q: 如何备份 LeanCloud 数据？

A: 
1. 登录 LeanCloud 控制台
2. 数据存储 → 设置 → 导出
3. 选择导出格式（JSON）
4. 定期下载备份

---

## 技术支持

- 文档：查看项目 README.md
- 邮件：support@chatgenius.ai
- LeanCloud 文档：https://leancloud.cn/docs/
- 支付宝文档：https://opendocs.alipay.com/
