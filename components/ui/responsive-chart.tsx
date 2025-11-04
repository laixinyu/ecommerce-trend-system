'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveChartProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  fullscreenEnabled?: boolean;
  minHeight?: string;
}

export function ResponsiveChart({
  title,
  description,
  children,
  className,
  fullscreenEnabled = true,
  minHeight = '300px',
}: ResponsiveChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card
      className={cn(
        'transition-all',
        isFullscreen && 'fixed inset-4 z-50 overflow-auto',
        className
      )}
    >
      {(title || description || fullscreenEnabled) && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="space-y-1">
            {title && <CardTitle className="text-base sm:text-lg">{title}</CardTitle>}
            {description && (
              <CardDescription className="text-xs sm:text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          {fullscreenEnabled && !isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div
          className="w-full"
          style={{
            minHeight: isMobile ? '250px' : minHeight,
            height: isFullscreen ? 'calc(100vh - 200px)' : 'auto',
          }}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// Mobile-optimized chart container with horizontal scroll
interface MobileChartScrollProps {
  children: React.ReactNode;
  minWidth?: string;
}

export function MobileChartScroll({ children, minWidth = '600px' }: MobileChartScrollProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div style={{ minWidth }} className="md:min-w-0">
        {children}
      </div>
    </div>
  );
}

// Responsive chart legend
interface ChartLegendProps {
  items: Array<{
    label: string;
    color: string;
    value?: string | number;
  }>;
  className?: string;
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm',
        className
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
          {item.value !== undefined && (
            <span className="font-medium">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
