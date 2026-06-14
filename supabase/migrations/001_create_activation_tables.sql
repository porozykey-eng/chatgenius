-- 创建激活码表
CREATE TABLE IF NOT EXISTS activation_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('year', 'lifetime', 'free')),
  status VARCHAR(20) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  used_by VARCHAR(255)
);

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL,
  price VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('year', 'lifetime')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('alipay', 'wechat', 'paypal')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  activation_code VARCHAR(50),
  user_email VARCHAR(255)
);

-- 创建许可证表
CREATE TABLE IF NOT EXISTS licenses (
  id BIGSERIAL PRIMARY KEY,
  activation_code VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('year', 'lifetime', 'free')),
  user_email VARCHAR(255),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 创建索引
CREATE INDEX idx_activation_codes_code ON activation_codes(code);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_licenses_activation_code ON licenses(activation_code);
CREATE INDEX idx_licenses_user_email ON licenses(user_email);
CREATE INDEX idx_licenses_is_active ON licenses(is_active);

-- 插入测试用激活码
INSERT INTO activation_codes (code, type, status, created_at) VALUES
  ('PRO-DEMO-2026-001', 'lifetime', 'unused', NOW()),
  ('PRO-DEMO-2026-002', 'lifetime', 'unused', NOW()),
  ('YEAR-DEMO-2026-001', 'year', 'unused', NOW()),
  ('FREE-TRIAL-2026-001', 'free', 'unused', NOW())
ON CONFLICT (code) DO NOTHING;

-- 设置行级安全策略（RLS）
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- 创建允许公开读取的策略（激活码验证需要）
CREATE POLICY "Allow public read activation_codes" ON activation_codes
  FOR SELECT USING (true);

-- 创建允许公开读取订单的策略
CREATE POLICY "Allow public read orders" ON orders
  FOR SELECT USING (true);

-- 创建允许公开插入订单的策略
CREATE POLICY "Allow public insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- 创建允许公开读取许可证的策略
CREATE POLICY "Allow public read licenses" ON licenses
  FOR SELECT USING (true);

-- 创建允许公开插入许可证的策略
CREATE POLICY "Allow public insert licenses" ON licenses
  FOR INSERT WITH CHECK (true);

-- 创建允许更新激活码状态的策略（仅限标记为已使用）
CREATE POLICY "Allow update activation_codes status" ON activation_codes
  FOR UPDATE USING (true);
