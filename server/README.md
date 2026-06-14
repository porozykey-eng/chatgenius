# ChatGenius AI Backend

后端服务，提供支付宝支付和许可证验证 API。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入真实值：

- **LEANCLOUD_APP_ID** 和 **LEANCLOUD_APP_KEY**：从 LeanCloud 控制台获取
- **ALIPAY_APP_ID**：从支付宝开放平台获取
- **ALIPAY_PRIVATE_KEY**：应用私钥（RSA2）
- **ALIPAY_PUBLIC_KEY**：支付宝公钥

### 3. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动。

## API 文档

### 支付宝支付

#### 创建订单（生成二维码）

```
POST /api/alipay/create-order
Content-Type: application/json

{
  "orderNo": "CG123456",
  "amount": "29.90",
  "subject": "ChatGenius AI Pro 永久版"
}

Response:
{
  "success": true,
  "qrCode": "https://qr.alipay.com/..."
}
```

#### 查询订单状态

```
GET /api/alipay/query-order/:orderNo

Response:
{
  "paid": true,
  "status": "TRADE_SUCCESS"
}
```

#### 支付回调（支付宝异步通知）

```
POST /api/alipay/notify

支付宝自动调用，无需手动触发
```

### 许可证验证

#### 验证激活码

```
POST /api/license/validate
Content-Type: application/json

{
  "code": "PRO-XXXX-XXXX"
}

Response:
{
  "valid": true,
  "type": "lifetime"
}
```

#### 查询许可证状态

```
GET /api/license/status/:code

Response:
{
  "active": true,
  "type": "lifetime"
}
```

## 部署

### 阿里云 ECS

```bash
# 上传代码到服务器
scp -r server/ root@your-server-ip:/opt/chatgenius

# 安装依赖
cd /opt/chatgenius
npm install

# 使用 PM2 启动
npm install -g pm2
pm2 start index.js --name chatgenius-api
pm2 save
pm2 startup
```

### 腾讯云函数

参考腾讯云文档配置函数计算。

## 支付宝沙箱测试

1. 访问 https://openhome.alipay.com/develop/sandbox/app
2. 创建沙箱应用
3. 获取沙箱 App ID 和密钥
4. 将 `ALIPAY_GATEWAY` 改为 `https://openapi-sandbox.dl.alipaydev.com/gateway.do`
5. 使用沙箱支付宝扫码支付（无需真实资金）

## 许可证

MIT
