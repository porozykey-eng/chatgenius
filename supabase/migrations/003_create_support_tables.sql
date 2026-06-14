-- 创建支持工单表
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('billing', 'technical', 'feature_request', 'bug_report', 'other')),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建支持消息表
CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'support')),
  sender_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_support_tickets_email ON support_tickets(user_email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX idx_support_messages_created ON support_messages(created_at DESC);

-- 设置行级安全策略（RLS）
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以查看自己的工单
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.email() = user_email);

-- 创建策略：用户可以创建自己的工单
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.email() = user_email);

-- 创建策略：用户可以查看自己工单的消息
CREATE POLICY "Users can view own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
      AND support_tickets.user_email = auth.email()
    )
  );

-- 创建策略：用户可以添加消息到自己的工单
CREATE POLICY "Users can add messages to own tickets" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
      AND support_tickets.user_email = auth.email()
    )
  );

-- 创建策略：客服可以查看所有工单（需要客服角色）
CREATE POLICY "Support can view all tickets" ON support_tickets
  FOR SELECT USING (auth.jwt() ->> 'role' = 'support');

-- 创建策略：客服可以更新所有工单
CREATE POLICY "Support can update all tickets" ON support_tickets
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'support');

-- 创建策略：客服可以查看所有消息
CREATE POLICY "Support can view all messages" ON support_messages
  FOR SELECT USING (auth.jwt() ->> 'role' = 'support');

-- 创建策略：客服可以添加消息
CREATE POLICY "Support can add messages" ON support_messages
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'support');
