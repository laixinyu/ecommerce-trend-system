// Module management types
export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'marketing' | 'growth' | 'content' | 'supply-chain' | 'intelligence';
  status: 'enabled' | 'disabled' | 'error';
  version: string;
  dependencies: string[];
  requiredIntegrations?: string[];
  features: ModuleFeature[];
  settings?: Record<string, any>;
  lastUpdated?: string;
}

export interface ModuleFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ModuleStatus {
  moduleId: string;
  status: 'enabled' | 'disabled' | 'error';
  health: 'healthy' | 'warning' | 'error';
  lastCheck: string;
  errorMessage?: string;
  metrics?: {
    uptime: number;
    apiCalls: number;
    errors: number;
  };
}

export interface ModuleRegistry {
  modules: ModuleConfig[];
  lastSync: string;
}
