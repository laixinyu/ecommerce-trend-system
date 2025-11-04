// 集成管理相关类型定义

export type ServiceType = 'marketing' | 'crm' | 'content' | 'supply_chain' | 'analytics';
export type IntegrationStatus = 'active' | 'inactive' | 'error';

export interface EncryptedCredentials {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  [key: string]: any;
}

export interface Integration {
  id: string;
  user_id: string;
  service_name: string;
  service_type: ServiceType;
  status: IntegrationStatus;
  credentials: EncryptedCredentials;
  config: Record<string, any>;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationInput {
  service_name: string;
  service_type: ServiceType;
  credentials: EncryptedCredentials;
  config?: Record<string, any>;
}

export interface UpdateIntegrationInput {
  status?: IntegrationStatus;
  credentials?: EncryptedCredentials;
  config?: Record<string, any>;
  last_sync_at?: string;
}

// OAuth相关类型
export interface OAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  authorization_endpoint: string;
  token_endpoint: string;
  scopes: string[];
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export interface OAuthState {
  user_id: string;
  service_name: string;
  state_token: string;
  created_at: number;
}
