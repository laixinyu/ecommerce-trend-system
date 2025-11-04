'use client';

import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  className?: string;
}

export function Feedback({ type, title, message, className }: FeedbackProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const variants = {
    success: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100',
    error: 'border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100',
    warning: 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100',
    info: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const Icon = icons[type];

  return (
    <Alert className={cn(variants[type], className)}>
      <Icon className={cn('h-4 w-4', iconColors[type])} />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// Inline feedback for forms
interface InlineFeedbackProps {
  type: 'success' | 'error';
  message: string;
  className?: string;
}

export function InlineFeedback({ type, message, className }: InlineFeedbackProps) {
  const Icon = type === 'success' ? CheckCircle : XCircle;
  const colorClass = type === 'success' ? 'text-green-600' : 'text-red-600';

  return (
    <div className={cn('flex items-center gap-2 text-sm', colorClass, className)}>
      <Icon className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

// Operation result card
interface OperationResultProps {
  success: boolean;
  title: string;
  message: string;
  details?: string[];
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

export function OperationResult({
  success,
  title,
  message,
  details,
  onRetry,
  onClose,
  className,
}: OperationResultProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-6 space-y-4',
        success
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-red-500 bg-red-50 dark:bg-red-900/20',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {success ? (
          <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <h3
            className={cn(
              'font-semibold',
              success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'text-sm',
              success
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            )}
          >
            {message}
          </p>
          {details && details.length > 0 && (
            <ul className="text-sm space-y-1 mt-3">
              {details.map((detail, index) => (
                <li
                  key={index}
                  className={cn(
                    'flex items-start gap-2',
                    success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  )}
                >
                  <span className="mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {(onRetry || onClose) && (
        <div className="flex gap-3 pt-2">
          {onRetry && !success && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              重试
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                success
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white text-red-900 border border-red-300 hover:bg-red-50'
              )}
            >
              {success ? '完成' : '关闭'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
