-- 创建用户设置表（云同步功能）
CREATE TABLE IF NOT EXISTS user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  personas JSONB NOT NULL DEFAULT '[]',
  faq_data JSONB NOT NULL DEFAULT '[]',
  license_type VARCHAR(20) NOT NULL DEFAULT 'free',
  last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_settings_email ON user_settings(user_email);
CREATE INDEX idx_user_settings_license_type ON user_settings(license_type);

-- 设置行级安全策略（RLS）
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以读取自己的设置
CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.email() = user_email);

-- 创建策略：用户可以插入自己的设置
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.email() = user_email);

-- 创建策略：用户可以更新自己的设置
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.email() = user_email);

-- 创建策略：用户可以删除自己的设置
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.email() = user_email);

-- 创建自动更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
