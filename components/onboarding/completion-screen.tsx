'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { WizardStepProps } from './integration-wizard';

export function CompletionScreen({ onNext, data }: WizardStepProps) {
  const handleFinish = () => {
    onNext({ completed: true });
  };

  const handleGoToModule = () => {
    // Navigate to the relevant module based on service category
    const moduleRoutes: Record<string, string> = {
      marketing: '/marketing',
      crm: '/growth',
      analytics: '/growth',
      content: '/content',
      supply_chain: '/supply-chain',
    };

    const route = moduleRoutes[data.serviceCategory] || '/dashboard';
    window.location.href = route;
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">配置完成！</h3>
        <p className="text-muted-foreground">
          {data.serviceName} 已成功集成到您的系统
        </p>
      </div>

      <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          集成已激活，数据将在后台自动同步
        </AlertDescription>
      </Alert>

      <div className="bg-muted p-6 rounded-lg space-y-4">
        <div className="font-medium">配置摘要</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">服务名称：</span>
            <span className="font-medium">{data.serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">授权状态：</span>
            <span className="font-medium">
              {data.authorized ? '已授权' : '待授权'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">连接测试：</span>
            <span className="font-medium">
              {data.testPassed ? '通过' : data.skipped ? '已跳过' : '未测试'}
            </span>
          </div>
          {data.config?.sync_frequency && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">同步频率：</span>
              <span className="font-medium">
                {data.config.sync_frequency === 'hourly' && '每小时'}
                {data.config.sync_frequency === 'daily' && '每天'}
                {data.config.sync_frequency === 'weekly' && '每周'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="font-medium text-sm">下一步操作：</div>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>系统将自动开始同步数据</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>您可以在相关模块中查看和分析数据</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>可以随时在设置中修改集成配置</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleGoToModule} className="flex-1">
          <ExternalLink className="h-4 w-4 mr-2" />
          进入模块
        </Button>
        <Button onClick={handleFinish} variant="outline">
          完成
        </Button>
      </div>
    </div>
  );
}
