import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

interface ProductFilters {
  category?: string;
  platform?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useProducts(filters: ProductFilters = {}, limit: number = 20) {
  return useQuery({
    queryKey: ['products', filters, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        ),
      });
      const response = await fetch(`/api/trends/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3分钟
  });
}

export function useInfiniteProducts(filters: ProductFilters = {}, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: String(pageParam),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        ),
      });
      const response = await fetch(`/api/trends/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.products.length < limit) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
    staleTime: 3 * 60 * 1000,
  });
}
