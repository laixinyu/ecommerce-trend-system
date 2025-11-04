import { useQuery } from '@tanstack/react-query';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/trends/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30分钟，类目数据变化较少
    gcTime: 60 * 60 * 1000, // 1小时
  });
}

export function useCategoryTrends(category: string, timeRange: string = '30d') {
  return useQuery({
    queryKey: ['category-trends', category, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        category,
        timeRange,
      });
      const response = await fetch(`/api/trends/categories?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category trends');
      }
      return response.json();
    },
    enabled: !!category,
    staleTime: 10 * 60 * 1000, // 10分钟
  });
}
