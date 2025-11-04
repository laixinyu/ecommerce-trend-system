'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextualHelpProps {
  title: string;
  content: string | React.ReactNode;
  learnMoreUrl?: string;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ContextualHelp({
  title,
  content,
  learnMoreUrl,
  className,
  side = 'right',
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-5 w-5 text-muted-foreground hover:text-foreground', className)}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">帮助</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{title}</h4>
          <div className="text-sm text-muted-foreground">
            {typeof content === 'string' ? <p>{content}</p> : content}
          </div>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              了解更多
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Inline help text component
interface InlineHelpProps {
  children: React.ReactNode;
  className?: string;
}

export function InlineHelp({ children, className }: InlineHelpProps) {
  return (
    <div
      className={cn(
        'text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-muted',
        className
      )}
    >
      <div className="flex gap-2">
        <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>{children}</div>
      </div>
    </div>
  );
}

// Feature tour step
interface TourStepProps {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function TourStep({
  title,
  description,
  step,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position = 'bottom',
}: TourStepProps) {
  return (
    <div className="bg-card border shadow-lg rounded-lg p-4 max-w-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">
              步骤 {step} / {totalSteps}
            </p>
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} className="h-auto p-1">
              跳过
            </Button>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  i + 1 === step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {onPrev && step > 1 && (
              <Button variant="outline" size="sm" onClick={onPrev}>
                上一步
              </Button>
            )}
            {onNext && step < totalSteps && (
              <Button size="sm" onClick={onNext}>
                下一步
              </Button>
            )}
            {step === totalSteps && onNext && (
              <Button size="sm" onClick={onNext}>
                完成
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
