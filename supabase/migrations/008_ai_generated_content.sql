-- AI生成内容表
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('product_description', 'ad_copy', 'social_post', 'email', 'improve')),
  prompt JSONB NOT NULL,
  content TEXT NOT NULL,
  model VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_ai_content_user ON ai_generated_content(user_id);
CREATE INDEX idx_ai_content_type ON ai_generated_content(type);
CREATE INDEX idx_ai_content_created ON ai_generated_content(created_at DESC);

-- 启用行级安全策略
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY ai_generated_content_user_policy ON ai_generated_content
  FOR ALL
  USING (auth.uid() = user_id);
