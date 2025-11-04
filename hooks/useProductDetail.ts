import { useQuery } from '@tanstack/react-query';

export function useProductDetail(productId: string | null) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await fetch(`/api/trends/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product detail');
      }
      return response.json();
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

export function useProductHistory(productId: string | null, timeRange: string = '30d') {
  return useQuery({
    queryKey: ['product-history', productId, timeRange],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await fetch(
        `/api/trends/products/${productId}/history?timeRange=${timeRange}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch product history');
      }
      return response.json();
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}
