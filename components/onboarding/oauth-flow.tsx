'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { WizardStepProps } from './integration-wizard';

export function OAuthFlow({ onNext, data }: WizardStepProps) {
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  useEffect(() => {
    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth-success') {
        setStatus('success');
        setAuthWindow(null);
        setTimeout(() => {
          onNext({
            integrationId: event.data.integrationId,
            authorized: true,
          });
        }, 1500);
      } else if (event.data.type === 'oauth-error') {
        setStatus('error');
        setErrorMessage(event.data.error || '授权失败');
        setAuthWindow(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNext]);

  const handleAuthorize = async () => {
    try {
      setStatus('authorizing');
      setErrorMessage('');

      // Initiate OAuth flow
      const response = await fetch('/api/integrations/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_name: data.serviceId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('请先登录后再配置集成');
        }
        throw new Error(result.error || result.details || '无法启动授权流程');
      }

      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        result.authUrl,
        'oauth-authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      setAuthWindow(popup);

      // Check if popup was blocked
      if (!popup || popup.closed) {
        throw new Error('弹窗被阻止，请允许弹窗后重试');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const handleSkip = () => {
    onNext({ authorized: false, skipped: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">授权连接</h3>
        <p className="text-sm text-muted-foreground">
          授权 {data.serviceName} 访问您的数据
        </p>
      </div>

      {status === 'idle' && (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              点击下方按钮将打开 {data.serviceName} 的授权页面。请登录您的账户并授予必要的权限。
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="font-medium text-sm">需要的权限：</div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 读取账户基本信息</li>
              <li>• 访问数据和报告</li>
              <li>• 管理活动和设置（可选）</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAuthorize} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              开始授权
            </Button>
            <Button variant="outline" onClick={handleSkip}>
              稍后配置
            </Button>
          </div>
        </div>
      )}

      {status === 'authorizing' && (
        <div className="space-y-4">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              正在等待授权...请在弹出的窗口中完成授权流程
            </AlertDescription>
          </Alert>

          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-4">
              请在授权窗口中完成操作
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              authWindow?.close();
              setStatus('idle');
            }}
            className="w-full"
          >
            取消授权
          </Button>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              授权成功！正在进入下一步...
            </AlertDescription>
          </Alert>

          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <p className="text-sm text-muted-foreground mt-4">
              已成功连接到 {data.serviceName}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button onClick={handleAuthorize} className="flex-1">
              重试授权
            </Button>
            <Button variant="outline" onClick={handleSkip}>
              稍后配置
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
