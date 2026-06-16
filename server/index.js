// ChatGenius AI Backend - Server Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const alipayRouter = require('./alipay');
const licenseRouter = require('./license');
const adminRouter = require('./admin');

const app = express();
const PORT = process.env.PORT || 3010;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data: https:"],
      connectSrc: ["'self'", "https://*.leancloud.cn"],
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
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests without Origin header (curl, server-to-server, direct navigation)
    if (!origin) {
      return callback(null, true);
    }
    // If no whitelist configured, allow all origins
    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }
    // Check against whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));

// Preserve raw body for Alipay notify signature verification
app.use('/api/alipay/notify', express.raw({ type: 'application/x-www-form-urlencoded' }));

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

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '管理操作过于频繁，请稍后再试' }
});

// Routes with rate limiting
app.use('/api/alipay', alipayLimiter, alipayRouter);
app.use('/api/license', licenseLimiter, licenseRouter);

// Admin dashboard
app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Frame-Options', 'DENY');
  res.sendFile(__dirname + '/admin.html');
});
app.use('/api/admin', adminLimiter, adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve landing page static files
const landingPath = __dirname + '/../landing-page/dist';
app.use(express.static(landingPath));
app.get('*', (req, res) => {
  res.sendFile(landingPath + '/index.html');
});

// Global error handler - hide internal details in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
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
  console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
});

module.exports = app;
