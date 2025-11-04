'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Info } from 'lucide-react';
import { WizardStepProps } from './integration-wizard';

interface ConfigField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  description?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

const SERVICE_CONFIGS: Record<string, ConfigField[]> = {
  meta_ads: [
    {
      id: 'sync_frequency',
      label: '同步频率',
      type: 'select',
      description: '数据自动同步的频率',
      required: true,
      options: [
        { value: 'hourly', label: '每小时' },
        { value: 'daily', label: '每天' },
        { value: 'weekly', label: '每周' },
      ],
      defaultValue: 'daily',
    },
    {
      id: 'include_insights', 
      label: '包含洞察数据',
      type: 'boolean',
      description: '同步详细的广告洞察数据',
      defaultValue: true,
    },
  ],
  google_ads: [
    {
      id: 'sync_frequency',
      label: '同步频率',
      type: 'select',
      required: true,
      options: [
        { value: 'hourly', label: '每小时' },
        { value: 'daily', label: '每天' },
        { value: 'weekly', label: '每周' },
      ],
      defaultValue: 'daily',
    },
    {
      id: 'customer_id',
      label: '客户ID',
      type: 'text',
      description: 'Google Ads客户ID（可选）',
      required: false,
    },
  ],
  shopify: [
    {
      id: 'store_url',
      label: '店铺URL',
      type: 'text',
      description: '您的Shopify店铺地址',
      required: true,
    },
    {
      id: 'sync_orders',
      label: '同步订单',
      type: 'boolean',
      defaultValue: true,
    },
    {
      id: 'sync_inventory',
      label: '同步库存',
      type: 'boolean',
      defaultValue: true,
    },
  ],
  default: [
    {
      id: 'sync_frequency',
      label: '同步频率',
      type: 'select',
      required: true,
      options: [
        { value: 'hourly', label: '每小时' },
        { value: 'daily', label: '每天' },
        { value: 'weekly', label: '每周' },
      ],
      defaultValue: 'daily',
    },
  ],
};

export function ConfigForm({ onNext, data }: WizardStepProps) {
  const configFields = SERVICE_CONFIGS[data.serviceId] || SERVICE_CONFIGS.default;
  
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    configFields.forEach((field) => {
      initial[field.id] = data.config?.[field.id] ?? field.defaultValue ?? '';
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (fieldId: string, value: any) => {
    setConfig({ ...config, [fieldId]: value });
    if (errors[fieldId]) {
      setErrors({ ...errors, [fieldId]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    configFields.forEach((field) => {
      if (field.required && !config[field.id]) {
        newErrors[field.id] = `${field.label}是必填项`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext({ config });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">配置选项</h3>
        <p className="text-sm text-muted-foreground">
          自定义 {data.serviceName} 的集成设置
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          这些设置可以在集成后随时修改
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {configFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            
            {field.type === 'text' && (
              <Input
                id={field.id}
                value={config[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.description}
              />
            )}

            {field.type === 'number' && (
              <Input
                id={field.id}
                type="number"
                value={config[field.id] || ''}
                onChange={(e) => handleChange(field.id, Number(e.target.value))}
                placeholder={field.description}
              />
            )}

            {field.type === 'select' && (
              <select
                id={field.id}
                value={config[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">请选择...</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'boolean' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.id}
                  checked={config[field.id] || false}
                  onCheckedChange={(checked) => handleChange(field.id, checked)}
                />
                <Label htmlFor={field.id} className="font-normal cursor-pointer">
                  {field.description || field.label}
                </Label>
              </div>
            )}

            {field.description && field.type !== 'boolean' && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}

            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext}>
          下一步
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
