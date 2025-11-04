'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
  id: string;
  service_name: string;
  service_type: string;
  status: string;
  last_sync_at: string | null;
  created_at: string;
}

const serviceIcons: Record<string, string> = {
  meta: '📘',
  google: '🔍',
  tiktok: '🎵',
  hubspot: '🟠',
  klaviyo: '💌',
  shopify: '🛍️',
  '17track': '📦',
  shipstation: '🚢',
};

const serviceLabels: Record<string, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok',
  hubspot: 'HubSpot CRM',
  klaviyo: 'Klaviyo',
  shopify: 'Shopify',
  '17track': '17Track',
  shipstation: 'ShipStation',
};

const serviceTypeLabels: Record<string, string> = {
  marketing: '营销',
  crm: 'CRM',
  content: '内容',
  supply_chain: '供应链',
  analytics: '分析',
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'danger'> = {
      active: 'default',
      inactive: 'secondary',
      error: 'danger',
    };
    
    const labels: Record<string, string> = {
      active: '已连接',
      inactive: '未激活',
      error: '错误',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">集成管理</h1>
          <p className="text-muted-foreground mt-2">
            连接第三方平台和服务
          </p>
        </div>
        <Link href="/integrations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            添加集成
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总集成数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已连接</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrations.filter(i => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未激活</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {integrations.filter(i => i.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错误</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {integrations.filter(i => i.status === 'error').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      {integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-lg font-semibold mb-2">暂无集成</h3>
            <p className="text-muted-foreground mb-6 text-center">
              连接第三方平台开始同步数据
            </p>
            <Link href="/integrations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加第一个集成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {serviceIcons[integration.service_name] || '🔌'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {serviceLabels[integration.service_name] || integration.service_name}
                      </CardTitle>
                      <CardDescription>
                        {serviceTypeLabels[integration.service_type] || integration.service_type}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(integration.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">状态</span>
                  {getStatusBadge(integration.status)}
                </div>

                {integration.last_sync_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">最后同步</span>
                    <span className="text-sm">
                      {new Date(integration.last_sync_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">创建时间</span>
                  <span className="text-sm">
                    {new Date(integration.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    同步
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>可用集成</CardTitle>
          <CardDescription>
            选择要连接的第三方服务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(serviceLabels).map(([key, label]) => {
              const isConnected = integrations.some(i => i.service_name === key);
              return (
                <Link key={key} href={`/integrations/new?service=${key}`}>
                  <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="text-2xl">{serviceIcons[key] || '🔌'}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{label}</div>
                        {isConnected && (
                          <Badge variant="secondary" className="mt-1">
                            已连接
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
