'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IntegrationWizard, WizardStep } from '@/components/onboarding/integration-wizard';
import { ServiceSelector } from '@/components/onboarding/service-selector';
import { OAuthFlow } from '@/components/onboarding/oauth-flow';
import { ConfigForm } from '@/components/onboarding/config-form';
import { ConnectionTest } from '@/components/onboarding/connection-test';
import { CompletionScreen } from '@/components/onboarding/completion-screen';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const wizardSteps: WizardStep[] = [
  {
    id: 'select',
    title: '选择服务',
    description: '选择要集成的第三方服务',
    component: ServiceSelector,
  },
  {
    id: 'auth',
    title: '授权连接',
    description: '授权访问您的账户',
    component: OAuthFlow,
  },
  {
    id: 'config',
    title: '配置选项',
    description: '自定义集成设置',
    component: ConfigForm,
  },
  {
    id: 'test',
    title: '测试连接',
    description: '验证集成是否正常工作',
    component: ConnectionTest,
  },
  {
    id: 'complete',
    title: '完成',
    description: '集成配置完成',
    component: CompletionScreen,
  },
];

export default function NewIntegrationPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/integrations');
        if (response.status === 401) {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleComplete = async (data: unknown) => {
    console.log('Integration completed:', data);
    // Redirect to integrations list
    setTimeout(() => {
      router.push('/integrations');
    }, 1000);
  };

  const handleCancel = () => {
    router.push('/integrations');
  };

  if (isAuthenticated === null) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">添加新集成</h1>
          <p className="text-muted-foreground mt-2">
            通过简单的步骤连接第三方服务
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            您需要先登录才能配置集成。
            <a href="/login" className="ml-2 underline">
              点击这里登录
            </a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">添加新集成</h1>
        <p className="text-muted-foreground mt-2">
          通过简单的步骤连接第三方服务
        </p>
      </div>

      <IntegrationWizard
        steps={wizardSteps}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
