// 行为分析相关类型定义

export interface UserEvent {
  id: string;
  user_id: string;
  customer_id?: string;
  event_name: string;
  event_type: 'page_view' | 'click' | 'purchase' | 'add_to_cart' | 'custom';
  properties: Record<string, any>;
  page_url?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  session_id: string;
  timestamp: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  customer_id?: string;
  session_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  page_views: number;
  events_count: number;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  created_at: string;
}

export interface EventTrackingConfig {
  id: string;
  user_id: string;
  event_name: string;
  event_type: string;
  is_active: boolean;
  trigger_conditions?: Record<string, any>;
  custom_properties?: string[];
  created_at: string;
  updated_at: string;
}

export interface BehaviorPath {
  path: string[];
  count: number;
  conversion_rate: number;
  avg_time: number;
}

export interface UserJourneyStep {
  step_number: number;
  event_name: string;
  page_url?: string;
  timestamp: string;
  time_from_previous?: number;
}

export interface UserJourney {
  customer_id: string;
  session_id: string;
  steps: UserJourneyStep[];
  total_duration: number;
  converted: boolean;
}
