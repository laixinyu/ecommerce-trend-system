-- 创建爬取日志表
CREATE TABLE IF NOT EXISTS crawl_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('amazon', 'aliexpress', 'ebay')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  items_collected INTEGER,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_crawl_logs_task_id ON crawl_logs(task_id);
CREATE INDEX idx_crawl_logs_platform ON crawl_logs(platform);
CREATE INDEX idx_crawl_logs_status ON crawl_logs(status);
CREATE INDEX idx_crawl_logs_started_at ON crawl_logs(started_at DESC);

-- 添加RLS策略
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有日志
CREATE POLICY "Admins can view all crawl logs"
  ON crawl_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- 添加注释
COMMENT ON TABLE crawl_logs IS '数据采集任务日志';
COMMENT ON COLUMN crawl_logs.task_id IS '任务ID';
COMMENT ON COLUMN crawl_logs.platform IS '平台名称';
COMMENT ON COLUMN crawl_logs.status IS '任务状态';
COMMENT ON COLUMN crawl_logs.items_collected IS '采集的商品数量';
COMMENT ON COLUMN crawl_logs.error_message IS '错误信息';
COMMENT ON COLUMN crawl_logs.started_at IS '开始时间';
COMMENT ON COLUMN crawl_logs.completed_at IS '完成时间';
COMMENT ON COLUMN crawl_logs.duration_ms IS '执行时长（毫秒）';
