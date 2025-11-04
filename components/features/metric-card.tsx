import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  const trendConfig = {
    up: { color: 'text-green-600', symbol: '↑' },
    down: { color: 'text-red-600', symbol: '↓' },
    neutral: { color: 'text-gray-600', symbol: '→' },
  };

  const config = trend ? trendConfig[trend] : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            
            {change !== undefined && config && (
              <p className={cn('mt-2 text-sm font-medium', config.color)}>
                <span>{config.symbol}</span>
                <span className="ml-1">{Math.abs(change)}%</span>
                <span className="ml-1 text-gray-500">较上周</span>
              </p>
            )}
          </div>

          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl">{icon}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
