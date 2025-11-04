import { ModuleConfig } from '@/types/modules';

// Module registry - defines all available modules in the system
export const MODULE_REGISTRY: ModuleConfig[] = [
  {
    id: 'products',
    name: '选品分析',
    description: '产品趋势分析、竞品对比、选品推荐',
    icon: 'TrendingUp',
    category: 'core',
    status: 'enabled',
    version: '1.0.0',
    dependencies: [],
    features: [
      {
        id: 'trend-analysis',
        name: '趋势分析',
        description: '分析产品趋势和市场热度',
        enabled: true,
      },
      {
        id: 'competitor-analysis',
        name: '竞品分析',
        description: '对比竞品数据和表现',
        enabled: true,
      },
    ],
  },
  {
    id: 'marketing',
    name: '营销数字化',
    description: '广告投放管理、营销数据分析、A/B测试',
    icon: 'Megaphone',
    category: 'marketing',
    status: 'enabled',
    version: '1.0.0',
    dependencies: [],
    requiredIntegrations: ['meta_ads', 'google_ads'],
    features: [
      {
        id: 'ad-campaigns',
        name: '广告活动管理',
        description: '管理和分析广告活动',
        enabled: true,
      },
      {
        id: 'seo-tracking',
        name: 'SEO追踪',
        description: 'Google Search Console数据追踪',
        enabled: true,
      },
      {
        id: 'ab-testing',
        name: 'A/B测试',
        description: '创建和分析A/B测试',
        enabled: true,
      },
    ],
  },
  {
    id: 'growth',
    name: '用户增长',
    description: 'CRM管理、客户分层、自动化营销',
    icon: 'Users',
    category: 'growth',
    status: 'enabled',
    version: '1.0.0',
    dependencies: [],
    requiredIntegrations: ['hubspot', 'klaviyo'],
    features: [
      {
        id: 'crm-sync',
        name: 'CRM同步',
        description: '同步CRM客户数据',
        enabled: true,
      },
      {
        id: 'rfm-analysis',
        name: 'RFM分析',
        description: '客户价值分层分析',
        enabled: true,
      },
      {
        id: 'automation',
        name: '自动化营销',
        description: '创建自动化营销规则',
        enabled: true,
      },
    ],
  },
  {
    id: 'content',
    name: '内容运营',
    description: '内容资产管理、AI生成、社媒分析',
    icon: 'FileText',
    category: 'content',
    status: 'enabled',
    version: '1.0.0',
    dependencies: [],
    requiredIntegrations: ['meta_insights', 'tiktok_analytics'],
    features: [
      {
        id: 'asset-management',
        name: '资产管理',
        description: '管理内容资产库',
        enabled: true,
      },
      {
        id: 'ai-generation',
        name: 'AI生成',
        description: 'AI辅助内容生成',
        enabled: true,
      },
      {
        id: 'social-analytics',
        name: '社媒分析',
        description: '社交媒体数据分析',
        enabled: true,
      },
    ],
  },
  {
    id: 'supply-chain',
    name: '供应链',
    description: '库存管理、订单追踪、物流监控',
    icon: 'Package',
    category: 'supply-chain',
    status: 'enabled',
    version: '1.0.0',
    dependencies: [],
    requiredIntegrations: ['shopify'],
    features: [
      {
        id: 'inventory',
        name: '库存管理',
        description: '实时库存监控和预警',
        enabled: true,
      },
      {
        id: 'orders',
        name: '订单管理',
        description: '订单同步和状态追踪',
        enabled: true,
      },
      {
        id: 'tracking',
        name: '物流追踪',
        description: '物流状态实时追踪',
        enabled: true,
      },
    ],
  },
  {
    id: 'intelligence',
    name: '智能决策',
    description: '统一仪表板、工作流自动化、AI预测',
    icon: 'Brain',
    category: 'intelligence',
    status: 'enabled',
    version: '1.0.0',
    dependencies: ['marketing', 'growth', 'content', 'supply-chain'],
    features: [
      {
        id: 'dashboards',
        name: '统一仪表板',
        description: '自定义数据仪表板',
        enabled: true,
      },
      {
        id: 'workflows',
        name: '工作流引擎',
        description: '自动化工作流配置',
        enabled: true,
      },
      {
        id: 'predictions',
        name: 'AI预测',
        description: '销量和趋势预测',
        enabled: true,
      },
      {
        id: 'alerts',
        name: '智能预警',
        description: '异常检测和预警',
        enabled: true,
      },
    ],
  },
];

// Get module by ID
export function getModuleById(moduleId: string): ModuleConfig | undefined {
  return MODULE_REGISTRY.find((m) => m.id === moduleId);
}

// Get modules by category
export function getModulesByCategory(category: string): ModuleConfig[] {
  return MODULE_REGISTRY.filter((m) => m.category === category);
}

// Get enabled modules
export function getEnabledModules(): ModuleConfig[] {
  return MODULE_REGISTRY.filter((m) => m.status === 'enabled');
}

// Check if module has required integrations
export function hasRequiredIntegrations(
  module: ModuleConfig,
  activeIntegrations: string[]
): boolean {
  if (!module.requiredIntegrations || module.requiredIntegrations.length === 0) {
    return true;
  }
  return module.requiredIntegrations.every((req) =>
    activeIntegrations.includes(req)
  );
}
