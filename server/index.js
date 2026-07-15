// ChatGenius AI Backend - Server Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs');

const alipayRouter = require('./alipay');
const wechatRouter = require('./wechat');
const licenseRouter = require('./license');
const adminRouter = require('./admin');
const invoiceRouter = require('./invoice');

const app = express();
const PORT = process.env.PORT || 3010;

// Trust proxy：Nginx 反向代理时需要开启，否则 express-rate-limit 会因
// X-Forwarded-For 头未识别而抛 ERR_ERL_UNEXPECTED_X_FORWARDED_FOR 错误，
// 导致激活码验证等限流接口返回 500
// P2-8 修复：精确配置可信代理（仅信任 loopback/linklocal/uniquelocal 地址）
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data: https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Request logging
app.use(morgan('combined'));

// Request body size limit
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// CORS with whitelist
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn('⚠️ CORS_ORIGINS 未配置，跨域请求将被拒绝！请在 .env 中配置允许的来源。');
}
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without Origin header (curl, server-to-server, direct navigation)
    if (!origin) {
      return callback(null, true);
    }
    // 未配置白名单时拒绝所有跨域请求（生产环境安全策略）
    if (allowedOrigins.length === 0) {
      return callback(new Error('Not allowed by CORS'));
    }
    // Check against whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));

// Preserve raw body for payment notify signature verification
app.use('/api/alipay/notify', express.raw({ type: 'application/x-www-form-urlencoded' }));
app.use('/api/wechat/notify', express.raw({ type: 'application/json' }));

// Rate limiting
const licenseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' }
});

const alipayLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' }
});

const wechatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' }
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '管理操作过于频繁，请稍后再试' }
});

const invoiceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' }
});

// Routes with rate limiting
app.use('/api/alipay', alipayLimiter, alipayRouter);
app.use('/api/wechat', wechatLimiter, wechatRouter);
app.use('/api/license', licenseLimiter, licenseRouter);
app.use('/api/invoice', invoiceLimiter, invoiceRouter);

// Admin dashboard (route obfuscated via ADMIN_ROUTE env var)
const adminRoute = process.env.ADMIN_ROUTE;
if (!adminRoute) {
  console.error('❌ ADMIN_ROUTE 必须在 .env 中配置为随机不可猜测的路径！');
  process.exit(1);
}
app.get(adminRoute, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Frame-Options', 'DENY');
  res.sendFile(__dirname + '/admin.html');
});
app.use('/api/admin', adminLimiter, adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 推荐配置（公开接口，CDN 缓存 1 小时）
let providersConfig = null;
try {
  providersConfig = JSON.parse(require('fs').readFileSync(__dirname + '/providers-config.json', 'utf8'));
} catch (e) {
  console.warn('⚠️ providers-config.json not found or invalid, using empty config');
  providersConfig = { version: '0', recommended: [], defaultProvider: 'deepseek' };
}
app.get('/api/config/providers', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(providersConfig);
});



// Serve guide.html directly (配置指南) - 统一使用 /guide/ 路径
const path = require('path');
const guidePath = path.resolve(__dirname, '../landing-page/public/guide.html');
app.get('/guide/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(guidePath);
});

// Redirect old guide paths to /guide/
app.get('/guide.html', (req, res) => res.redirect(301, '/guide/'));
app.get('/guide', (req, res) => res.redirect(301, '/guide/'));

// extension.zip 路由必须在 express.static 之前注册！
// 否则 express.static 会先匹配到 dist/extension.zip（可能过时），导致用户下载到旧版本
const landingPath = __dirname + '/../landing-page/dist';
const publicZipPath = path.join(__dirname, '..', 'landing-page', 'public', 'extension.zip');

function getZipBuffer() {
  if (!fs.existsSync(publicZipPath)) {
    console.error('[extension.zip] 文件不存在:', publicZipPath);
    return null;
  }
  const mtime = fs.statSync(publicZipPath).mtimeMs;
  // mtime 变化时重新加载，确保用户下载到最新版本
  if (app.locals.zipBuffer && app.locals.zipMtime === mtime) {
    return app.locals.zipBuffer;
  }
  app.locals.zipBuffer = fs.readFileSync(publicZipPath);
  app.locals.zipMtime = mtime;
  console.log('[extension.zip] 已加载:', publicZipPath, Math.round(app.locals.zipBuffer.length / 1024) + 'KB', 'mtime:', new Date(mtime).toISOString());
  return app.locals.zipBuffer;
}

app.get('/extension.zip', (req, res) => {
  const buf = getZipBuffer();
  if (!buf) {
    return res.status(404).json({ error: '下载文件未找到，请联系管理员' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Disposition', 'attachment; filename="ChatGenius-AI-Extension.zip"');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
});

// Serve landing page static files（在 /extension.zip 路由之后注册）
// 静态资源默认缓存 1 小时（HTML/CSS/JS/图片等）
app.use(express.static(landingPath, {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

app.get('*', (req, res) => {
  res.sendFile(landingPath + '/index.html');
});

// Global error handler - hide internal details in production
app.use((err, req, res, next) => {
  // P3-8 修复：仅打印 message 和 stack，避免完整 err 对象可能包含 req.body 敏感数据
  console.error('Unhandled error:', err.message, err.stack);
  const statusCode = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({ 
    error: isProd ? '服务器内部错误' : (err.message || '服务器内部错误') 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ChatGenius AI Server running on port ${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`💚 Alipay: http://localhost:${PORT}/api/alipay`);
  console.log(`🔑 License: http://localhost:${PORT}/api/license`);
  console.log(`🔧 Admin: configured (path hidden for security)`);
});

// P2-21 修复：进程级未捕获异常处理，避免进程崩溃
process.on('unhandledRejection', (reason, promise) => {
  // P3-8 修复：reason 可能是 Error 对象或含敏感上下文，仅打印 message
  const reasonMsg = reason instanceof Error ? reason.message : String(reason);
  console.error('Unhandled Rejection reason:', reasonMsg);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
});

module.exports = app;
