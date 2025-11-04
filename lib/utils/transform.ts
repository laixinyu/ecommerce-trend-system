/**
 * 数据转换工具 - 将数据库字段转换为前端格式
 */

import type { Product } from '@/types';

// 数据库产品类型
interface DbProduct {
  id: string;
  name: string;
  platform: string;
  platform_id: string;
  category_id?: string;
  current_price?: number;
  original_price?: number;
  image_url?: string;
  product_url?: string;
  external_url?: string;
  trend_score?: number;
  competition_score?: number;
  profit_estimate?: number;
  recommendation_score?: number;
  average_rating?: number;
  review_count?: number;
  seller_count?: number;
  sales_volume?: number;
  last_crawled_at?: string;
  created_at?: string;
  updated_at?: string;
  categories?: unknown;
}

/**
 * 转换单个产品数据
 */
export function transformProduct(product: DbProduct | null): Product | null {
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    platform: product.platform,
    platformId: product.platform_id,
    categoryId: product.category_id,
    currentPrice: product.current_price || 0,
    originalPrice: product.original_price,
    imageUrl: product.image_url,
    productUrl: product.product_url,
    externalUrl: product.external_url,
    trendScore: product.trend_score || 0,
    competitionScore: product.competition_score || 0,
    profitEstimate: product.profit_estimate || 0,
    recommendationScore: product.recommendation_score || 0,
    averageRating: product.average_rating || 0,
    reviewCount: product.review_count || 0,
    sellerCount: product.seller_count || 0,
    salesVolume: product.sales_volume || 0,
    lastCrawledAt: product.last_crawled_at,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    categories: product.categories,
  } as Product;
}

/**
 * 转换产品数组
 */
export function transformProducts(products: DbProduct[]): Product[] {
  if (!products || !Array.isArray(products)) return [];
  return products.map(transformProduct).filter((p): p is Product => p !== null);
}
