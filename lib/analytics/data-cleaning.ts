/**
 * 数据清洗工具函数
 */

import type { Product } from '@/types';

/**
 * 数据去重
 */
export function deduplicateProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = `${product.platform}-${product.platformId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 数据验证
 */
export function validateProduct(product: Partial<Product>): boolean {
  // 必填字段验证
  if (!product.name || !product.platform || !product.platformId) {
    return false;
  }

  // 价格验证
  if (product.currentPrice !== undefined && product.currentPrice < 0) {
    return false;
  }

  // 评分验证
  if (product.trendScore !== undefined && (product.trendScore < 0 || product.trendScore > 100)) {
    return false;
  }

  if (
    product.competitionScore !== undefined &&
    (product.competitionScore < 0 || product.competitionScore > 10)
  ) {
    return false;
  }

  if (
    product.recommendationScore !== undefined &&
    (product.recommendationScore < 0 || product.recommendationScore > 100)
  ) {
    return false;
  }

  // 评分验证
  if (
    product.averageRating !== undefined &&
    (product.averageRating < 0 || product.averageRating > 5)
  ) {
    return false;
  }

  return true;
}

/**
 * 数据标准化
 */
export function normalizeProduct(product: Partial<Product>): Partial<Product> {
  return {
    ...product,
    name: product.name?.trim(),
    currentPrice: product.currentPrice ? Math.round(product.currentPrice * 100) / 100 : 0,
    trendScore: product.trendScore ? Math.round(product.trendScore * 100) / 100 : 0,
    competitionScore: product.competitionScore
      ? Math.round(product.competitionScore * 100) / 100
      : 0,
    recommendationScore: product.recommendationScore
      ? Math.round(product.recommendationScore * 100) / 100
      : 0,
    averageRating: product.averageRating ? Math.round(product.averageRating * 10) / 10 : 0,
    sellerCount: product.sellerCount || 0,
    reviewCount: product.reviewCount || 0,
  };
}

/**
 * 数据质量评分
 */
export function scoreDataQuality(product: Partial<Product>): number {
  let score = 0;
  const maxScore = 10;

  // 基本信息完整性 (4分)
  if (product.name) score += 1;
  if (product.platform && product.platformId) score += 1;
  if (product.categoryId) score += 1;
  if (product.imageUrl) score += 1;

  // 价格信息 (2分)
  if (product.currentPrice && product.currentPrice > 0) score += 2;

  // 评分信息 (2分)
  if (product.trendScore !== undefined) score += 0.5;
  if (product.competitionScore !== undefined) score += 0.5;
  if (product.recommendationScore !== undefined) score += 0.5;
  if (product.averageRating !== undefined) score += 0.5;

  // 统计信息 (2分)
  if (product.sellerCount && product.sellerCount > 0) score += 1;
  if (product.reviewCount && product.reviewCount > 0) score += 1;

  return (score / maxScore) * 100;
}

/**
 * 过滤低质量数据
 */
export function filterLowQualityProducts(
  products: Product[],
  minQualityScore: number = 50
): Product[] {
  return products.filter((product) => {
    const quality = scoreDataQuality(product);
    return quality >= minQualityScore;
  });
}

/**
 * 清洗异常数据
 */
export function cleanAnomalousData(products: Product[]): Product[] {
  return products.filter((product) => {
    // 过滤价格异常的商品
    if (product.currentPrice > 1000000) return false; // 价格过高
    if (product.currentPrice < 0.01) return false; // 价格过低

    // 过滤评论数异常的商品
    if (product.reviewCount > 10000000) return false; // 评论数异常高

    // 过滤卖家数异常的商品
    if (product.sellerCount > 100000) return false; // 卖家数异常高

    return true;
  });
}

/**
 * 批量清洗数据
 */
export function cleanProducts(products: Product[]): Product[] {
  // 1. 去重
  let cleaned = deduplicateProducts(products);

  // 2. 验证
  cleaned = cleaned.filter(validateProduct);

  // 3. 标准化
  cleaned = cleaned.map((p) => normalizeProduct(p) as Product);

  // 4. 清洗异常数据
  cleaned = cleanAnomalousData(cleaned);

  // 5. 过滤低质量数据
  cleaned = filterLowQualityProducts(cleaned);

  return cleaned;
}
