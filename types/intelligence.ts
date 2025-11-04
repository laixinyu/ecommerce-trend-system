// Intelligence Module Types

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: Widget[];
  is_default: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  columns: number;
  gap: number;
  responsive: boolean;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  data_source: DataSource;
  config: WidgetConfig;
  position: WidgetPosition;
  refresh_interval?: number;
}

export type WidgetType = 
  | 'metric'
  | 'chart'
  | 'table'
  | 'funnel'
  | 'gauge'
  | 'list'
  | 'map';

export interface DataSource {
  module: 'marketing' | 'growth' | 'content' | 'supply-chain' | 'products';
  endpoint: string;
  params?: Record<string, any>;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  format?: 'number' | 'currency' | 'percentage' | 'date';
  threshold?: {
    warning: number;
    critical: number;
  };
  [key: string]: any;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image?: string;
  widgets: Omit<Widget, 'id'>[];
  layout: DashboardLayout;
}

// Workflow Types
export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'draft';
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'manual' | 'webhook';
  config: ScheduleConfig | EventConfig | WebhookConfig;
}

export interface ScheduleConfig {
  cron: string;
  timezone: string;
}

export interface EventConfig {
  event_type: string;
  conditions: WorkflowCondition[];
}

export interface WebhookConfig {
  url: string;
  secret?: string;
}

export interface WorkflowStep {
  id: string;
  type: 'condition' | 'action' | 'delay' | 'loop';
  name: string;
  config: StepConfig;
  next_step_id?: string;
  else_step_id?: string;
}

export interface StepConfig {
  // Condition step
  conditions?: WorkflowCondition[];
  operator?: 'and' | 'or';
  
  // Action step
  action_type?: string;
  action_params?: Record<string, any>;
  
  // Delay step
  duration?: number;
  unit?: 'seconds' | 'minutes' | 'hours' | 'days';
  
  // Loop step
  items?: string;
  max_iterations?: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error?: string;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  step_id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

// Prediction Types
export interface Prediction {
  id: string;
  user_id: string;
  type: 'sales' | 'pricing' | 'inventory' | 'trend';
  target: string;
  predictions: PredictionPoint[];
  confidence: number;
  model: string;
  created_at: string;
}

export interface PredictionPoint {
  date: string;
  value: number;
  lower_bound?: number;
  upper_bound?: number;
}

export interface PricingSuggestion {
  product_id: string;
  current_price: number;
  suggested_price: number;
  expected_impact: {
    sales_change: number;
    revenue_change: number;
  };
  reasoning: string;
}

export interface InventoryForecast {
  sku: string;
  current_stock: number;
  predicted_demand: PredictionPoint[];
  reorder_recommendation: {
    date: string;
    quantity: number;
    urgency: 'low' | 'medium' | 'high';
  };
}

// Alert Types
export interface Alert {
  id: string;
  user_id: string;
  type: 'metric' | 'anomaly' | 'threshold' | 'prediction';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric?: string;
  current_value?: number;
  threshold_value?: number;
  suggested_actions?: string[];
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export interface MetricMonitor {
  id: string;
  user_id: string;
  name: string;
  metric: string;
  data_source: DataSource;
  conditions: AlertCondition[];
  notification_channels: NotificationChannel[];
  status: 'active' | 'paused';
  created_at: string;
}

export interface AlertCondition {
  type: 'threshold' | 'change' | 'anomaly';
  operator?: 'gt' | 'lt' | 'eq';
  value?: number;
  change_percentage?: number;
  time_window?: number;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'webhook' | 'in_app';
  config: Record<string, any>;
}

// Export Types
export interface ExportJob {
  id: string;
  user_id: string;
  type: 'excel' | 'csv' | 'google_sheets' | 'power_bi' | 'tableau';
  data_source: DataSource;
  filters?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface ReportTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  schedule?: ScheduleConfig;
  recipients?: string[];
  created_at: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'metrics';
  data_source?: DataSource;
  config: Record<string, any>;
}

// Aggregated Data Types
export interface AggregatedMetrics {
  marketing: {
    total_spend: number;
    total_revenue: number;
    roas: number;
    active_campaigns: number;
  };
  growth: {
    total_customers: number;
    active_customers: number;
    churn_rate: number;
    avg_ltv: number;
  };
  content: {
    total_assets: number;
    total_engagement: number;
    avg_engagement_rate: number;
    top_platform: string;
  };
  supply_chain: {
    total_inventory_value: number;
    low_stock_items: number;
    pending_orders: number;
    avg_fulfillment_time: number;
  };
  products: {
    total_products: number;
    trending_products: number;
    avg_rating: number;
  };
}
