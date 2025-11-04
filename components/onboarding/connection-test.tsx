'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { WizardStepProps } from './integration-wizard';

interface TestResult {
  success: boolean;
  message: string;
  details?: string[];
}

export function ConnectionTest({ onNext, data }: WizardStepProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Test the connection
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId: data.integrationId,
          serviceId: data.serviceId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTestResult({
          success: true,
          message: '连接测试成功！',
          details: result.details || [
            '成功连接到服务',
            '权限验证通过',
            '数据访问正常',
          ],
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || '连接测试失败',
          details: result.details,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: '连接测试失败',
        details: [error.message || '未知错误'],
      });
    } finally {
      setTesting(false);
    }
  };

  const handleNext = () => {
    onNext({ testPassed: testResult?.success });
  };

  const handleSkip = () => {
    onNext({ testPassed: false, skipped: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">测试连接</h3>
        <p className="text-sm text-muted-foreground">
          验证与 {data.serviceName} 的连接是否正常
        </p>
      </div>

      {!testResult && !testing && (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              点击下方按钮测试连接。我们将验证授权状态并尝试获取基本数据。
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button onClick={handleTest} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              开始测试
            </Button>
            <Button variant="outline" onClick={handleSkip}>
              跳过测试
            </Button>
          </div>
        </div>
      )}

      {testing && (
        <div className="space-y-4">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>正在测试连接...</AlertDescription>
          </Alert>

          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-4">
              正在验证连接和权限
            </p>
          </div>
        </div>
      )}

      {testResult && (
        <div className="space-y-4">
          <Alert
            className={
              testResult.success
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription
              className={
                testResult.success
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }
            >
              {testResult.message}
            </AlertDescription>
          </Alert>

          {testResult.details && testResult.details.length > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="font-medium text-sm">测试详情：</div>
              <ul className="text-sm space-y-1">
                {testResult.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            {testResult.success ? (
              <Button onClick={handleNext} className="flex-1">
                继续
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button onClick={handleTest} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新测试
                </Button>
                <Button onClick={handleSkip} variant="outline">
                  跳过
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
