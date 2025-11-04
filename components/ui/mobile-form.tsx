'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileFormProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function MobileForm({
  title,
  description,
  children,
  onSubmit,
  submitLabel = '提交',
  cancelLabel = '取消',
  onCancel,
  isSubmitting = false,
  className,
}: MobileFormProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className="space-y-1 pb-4">
          {title && <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-sm">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
          {children}
          
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto sm:ml-auto"
            >
              {isSubmitting ? '提交中...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Mobile-optimized form field
interface MobileFormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

export function MobileFormField({
  label,
  children,
  error,
  required,
  description,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {error && <p className="text-xs sm:text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Stacked form layout for mobile
interface StackedFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function StackedFormSection({
  title,
  description,
  children,
  className,
}: StackedFormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-base font-medium">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
