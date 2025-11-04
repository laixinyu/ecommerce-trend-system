'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUp, 
  Megaphone, 
  Users, 
  FileText, 
  Package, 
  Brain,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ModuleConfig, ModuleStatus } from '@/types/modules';

const iconMap: Record<string, any> = {
  TrendingUp,
  Megaphone,
  Users,
  FileText,
  Package,
  Brain,
};

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
    fetchStatuses();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules');
      const data = await response.json();
      setModules(data.modules || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/modules/status');
      const data = await response.json();
      const statusMap = (data.statuses || []).reduce(
        (acc: Record<string, ModuleStatus>, status: ModuleStatus) => {
          acc[status.moduleId] = status;
          return acc;
        },
        {}
      );
      setStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const toggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      // Update local state
      setModules(modules.map(m => 
        m.id === moduleId ? { ...m, status: enabled ? 'enabled' : 'disabled' } : m
      ));
      
      // Refresh statuses
      fetchStatuses();
    } catch (error) {
      console.error('Error toggling module:', error);
    }
  };

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
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
      <div>
        <h1 className="text-3xl font-bold">模块管理</h1>
        <p className="text-muted-foreground mt-2">
          管理和配置系统功能模块
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = iconMap[module.icon] || TrendingUp;
          const status = statuses[module.id];
          const isEnabled = module.status === 'enabled';

          return (
            <Card key={module.id} className={!isEnabled ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isEnabled ? 'default' : 'secondary'}>
                          {isEnabled ? '已启用' : '已禁用'}
                        </Badge>
                        {status && getHealthIcon(status.health)}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => toggleModule(module.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>{module.description}</CardDescription>

                {status?.errorMessage && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {status.errorMessage}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium">功能特性</div>
                  <div className="space-y-1">
                    {module.features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {feature.name}
                      </div>
                    ))}
                  </div>
                </div>

                {module.requiredIntegrations && module.requiredIntegrations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">必需集成</div>
                    <div className="flex flex-wrap gap-1">
                      {module.requiredIntegrations.map((integration) => (
                        <Badge key={integration} variant="outline" className="text-xs">
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {module.dependencies && module.dependencies.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">依赖模块</div>
                    <div className="flex flex-wrap gap-1">
                      {module.dependencies.map((dep) => (
                        <Badge key={dep} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.location.href = `/${module.id}`}
                    disabled={!isEnabled}
                  >
                    进入模块
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
