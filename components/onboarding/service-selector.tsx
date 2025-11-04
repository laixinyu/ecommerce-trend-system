'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { WizardStepProps } from './integration-wizard';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  popular?: boolean;
}

const AVAILABLE_SERVICES: Service[] = [
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Facebook和Instagram广告管理',
    category: 'marketing',
    icon: '📱',
    popular: true,
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Google搜索和展示广告',
    category: 'marketing',
    icon: '🔍',
    popular: true,
  },
  {
    id: 'google_search_console',
    name: 'Google Search Console',
    description: 'SEO数据和搜索表现',
    category: 'marketing',
    icon: '📊',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM和营销自动化',
    category: 'crm',
    icon: '🎯',
    popular: true,
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: '邮件营销和客户数据',
    category: 'crm',
    icon: '✉️',
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics 4',
    description: '网站分析和用户行为',
    category: 'analytics',
    icon: '📈',
  },
  {
    id: 'meta_insights',
    name: 'Meta Insights',
    description: 'Facebook和Instagram内容分析',
    category: 'content',
    icon: '📸',
  },
  {
    id: 'tiktok_analytics',
    name: 'TikTok Analytics',
    description: 'TikTok内容表现分析',
    category: 'content',
    icon: '🎵',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: '电商平台订单和库存',
    category: 'supply_chain',
    icon: '🛍️',
    popular: true,
  },
  {
    id: '17track',
    name: '17Track',
    description: '物流追踪服务',
    category: 'supply_chain',
    icon: '📦',
  },
  {
    id: 'shipstation',
    name: 'ShipStation',
    description: '物流管理平台',
    category: 'supply_chain',
    icon: '🚚',
  },
];

export function ServiceSelector({ onNext, data }: WizardStepProps) {
  const [selectedService, setSelectedService] = useState<string | null>(
    data.serviceId || null
  );

  const handleNext = () => {
    if (selectedService) {
      const service = AVAILABLE_SERVICES.find((s) => s.id === selectedService);
      onNext({
        serviceId: selectedService,
        serviceName: service?.name,
        serviceCategory: service?.category,
      });
    }
  };

  const categories = Array.from(new Set(AVAILABLE_SERVICES.map((s) => s.category)));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">选择要集成的服务</h3>
        <p className="text-sm text-muted-foreground">
          选择一个第三方服务开始配置集成
        </p>
      </div>

      {categories.map((category) => {
        const services = AVAILABLE_SERVICES.filter((s) => s.category === category);
        const categoryNames: Record<string, string> = {
          marketing: '营销广告',
          crm: 'CRM客户管理',
          analytics: '数据分析',
          content: '内容运营',
          supply_chain: '供应链',
        };

        return (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              {categoryNames[category]}
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${
                    selectedService === service.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{service.icon}</div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {service.name}
                            {service.popular && (
                              <Badge variant="secondary" className="text-xs">
                                热门
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {service.description}
                          </CardDescription>
                        </div>
                      </div>
                      {selectedService === service.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!selectedService}>
          下一步
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
