// CRM相关类型定义

export type CustomerSegment = 'vip' | 'active' | 'at_risk' | 'lost' | 'new';

export interface RFMScore {
  recency: number; // 1-5
  frequency: number; // 1-5
  monetary: number; // 1-5
  total: number; // 3-15
}

export interface Customer {
  id: string;
  user_id: string;
  external_id: string;
  email: string;
  name: string;
  phone?: string;
  segment: CustomerSegment;
  rfm_score: RFMScore;
  ltv: number;
  first_purchase_at?: string;
  last_purchase_at?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface FieldMapping {
  source_field: string;
  target_field: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'parse_date' | 'parse_number';
}

export interface CRMDataMapping {
  id: string;
  user_id: string;
  integration_id: string;
  service_name: string;
  field_mappings: FieldMapping[];
  custom_mappings?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateDataMappingInput {
  integration_id: string;
  field_mappings: FieldMapping[];
  custom_mappings?: Record<string, string>;
}
