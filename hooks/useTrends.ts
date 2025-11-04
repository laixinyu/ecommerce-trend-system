import { useQuery } from '@tanstack/react-query';

interface TrendData {
  platform: string;
  totalProducts: number;
  avgTrendScore: number;
  topCategories: string[];
}

export function useTrends(timeRange: string = '30d') {
  return useQuery({
    queryKey: ['trends', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/trends/dashboard?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  });
}

export function useTrendComparison(productIds: string[], timeRange: string = '30d') {
  return useQuery({
    queryKey: ['trend-comparison', productIds, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        productIds: productIds.join(','),
        timeRange,
      });
      const response = await fetch(`/api/trends/compare?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trend comparison');
      }
      return response.json();
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
