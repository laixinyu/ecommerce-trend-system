-- 数字化能力扩展 - 数据库Schema

-- 集成管理表
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name VARCHAR(50) NOT NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('marketing', 'crm', 'content', 'supply_chain', 'analytics')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  credentials JSONB NOT NULL,
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 营销数据表
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok')),
  campaign_id VARCHAR(100) NOT NULL,
  campaign_name VARCHAR(200),
  status VARCHAR(20) CHECK (status IN ('active', 'paused', 'ended')),
  daily_budget DECIMAL(10,2),
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, campaign_id)
);

-- CRM客户表
CREATE TABLE IF NOT EXISTS crm_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id VARCHAR(100),
  email VARCHAR(255),
  name VARCHAR(200),
  segment VARCHAR(20) CHECK (segment IN ('vip', 'active', 'at_risk', 'lost', 'new')),
  rfm_score JSONB,
  ltv DECIMAL(10,2),
  first_purchase_at TIMESTAMP WITH TIME ZONE,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 自动化规则表
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  trigger JSONB NOT NULL,
  actions JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 内容资产表
CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'text', 'mixed')),
  title VARCHAR(200),
  description TEXT,
  tags TEXT[],
  platform VARCHAR(20) CHECK (platform IN ('meta', 'tiktok', 'instagram', 'youtube')),
  url TEXT,
  storage_path TEXT,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  product_name VARCHAR(200),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_in_transit INTEGER DEFAULT 0,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  unit_cost DECIMAL(10,2),
  warehouse_location VARCHAR(100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_order_id VARCHAR(100),
  platform VARCHAR(20) CHECK (platform IN ('shopify', 'woocommerce', 'amazon')),
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  items JSONB,
  total_amount DECIMAL(10,2),
  shipping_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 仪表板表
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  layout JSONB,
  widgets JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 工作流表
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  trigger JSONB NOT NULL,
  steps JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_integrations_user ON integrations(user_id);
CREATE INDEX idx_integrations_service ON integrations(service_name);
CREATE INDEX idx_ad_campaigns_integration ON ad_campaigns(integration_id);
CREATE INDEX idx_ad_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX idx_crm_customers_user ON crm_customers(user_id);
CREATE INDEX idx_crm_customers_segment ON crm_customers(segment);
CREATE INDEX idx_crm_customers_email ON crm_customers(email);
CREATE INDEX idx_automation_rules_user ON automation_rules(user_id);
CREATE INDEX idx_content_assets_user ON content_assets(user_id);
CREATE INDEX idx_content_assets_platform ON content_assets(platform);
CREATE INDEX idx_inventory_user ON inventory_items(user_id);
CREATE INDEX idx_inventory_sku ON inventory_items(sku);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_platform ON orders(platform);
CREATE INDEX idx_dashboards_user ON dashboards(user_id);
CREATE INDEX idx_workflows_user ON workflows(user_id);

-- 添加更新时间触发器
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_customers_updated_at BEFORE UPDATE ON crm_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_assets_updated_at BEFORE UPDATE ON content_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY integrations_user_policy ON integrations
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY ad_campaigns_user_policy ON ad_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM integrations
      WHERE integrations.id = ad_campaigns.integration_id
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY crm_customers_user_policy ON crm_customers
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY automation_rules_user_policy ON automation_rules
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY content_assets_user_policy ON content_assets
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY inventory_items_user_policy ON inventory_items
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY orders_user_policy ON orders
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY dashboards_user_policy ON dashboards
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY workflows_user_policy ON workflows
  FOR ALL
  USING (auth.uid() = user_id);

-- Intelligence Module Tables

-- Dashboards table (extended)
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sales', 'pricing', 'inventory', 'trend')),
  target VARCHAR(200) NOT NULL,
  predictions JSONB NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  model VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('metric', 'anomaly', 'threshold', 'prediction')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metric VARCHAR(100),
  current_value DECIMAL(10,2),
  threshold_value DECIMAL(10,2),
  suggested_actions TEXT[],
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Metric Monitors table
CREATE TABLE IF NOT EXISTS metric_monitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  data_source JSONB NOT NULL,
  conditions JSONB NOT NULL,
  notification_channels JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export Jobs table
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('excel', 'csv', 'google_sheets', 'power_bi', 'tableau')),
  data_source JSONB NOT NULL,
  filters JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Report Templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sections JSONB NOT NULL,
  schedule JSONB,
  recipients TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  logs JSONB
);

-- Notifications table (for in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  severity VARCHAR(20),
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for intelligence tables
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_type ON predictions(type);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_metric_monitors_user ON metric_monitors(user_id);
CREATE INDEX idx_export_jobs_user ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_report_templates_user ON report_templates(user_id);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user ON workflow_executions(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Enable RLS for intelligence tables
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for intelligence tables
CREATE POLICY predictions_user_policy ON predictions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY alerts_user_policy ON alerts
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY metric_monitors_user_policy ON metric_monitors
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY export_jobs_user_policy ON export_jobs
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY report_templates_user_policy ON report_templates
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY workflow_executions_user_policy ON workflow_executions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY notifications_user_policy ON notifications
  FOR ALL
  USING (auth.uid() = user_id);
