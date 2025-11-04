// 自动化营销系统类型定义

export type TriggerType =
  | 'purchase'
  | 'abandoned_cart'
  | 'segment_change'
  | 'time_based'
  | 'inactivity';

export type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'add_tag'
  | 'update_segment'
  | 'webhook';

export interface TriggerConfig {
  type: TriggerType;
  conditions: Record<string, any>;
}

export interface ActionConfig {
  type: ActionType;
  config: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  status: 'active' | 'paused';
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAutomationRuleInput {
  name: string;
  description?: string;
  trigger: TriggerConfig;
  actions: ActionConfig[];
}

export interface UpdateAutomationRuleInput {
  name?: string;
  description?: string;
  trigger?: TriggerConfig;
  actions?: ActionConfig[];
  status?: 'active' | 'paused';
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  customer_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  trigger_data: Record<string, any>;
  actions_executed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface AutomationLog {
  id: string;
  rule_id: string;
  execution_id: string;
  action_type: ActionType;
  status: 'success' | 'failed';
  details: Record<string, any>;
  error_message?: string;
  created_at: string;
}
