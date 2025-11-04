/**
 * 竞争度评分算法
 */

import type { Product } from '@/types';

/**
 * 归一化函数
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * 计算卖家数量分数
 */
export function calculateSellerCountScore(sellerCount: number): number {
  // 卖家数量越多，竞争越激烈
  // 0-10个卖家 = 低竞争 (0-3分)
  // 10-100个卖家 = 中等竞争 (3-7分)
  // 100+个卖家 = 高竞争 (7-10分)

  if (sellerCount <= 10) {
    return normalize(sellerCount, 0, 10) * 3;
  } else if (sellerCount <= 100) {
    return 3 + normalize(sellerCount - 10, 0, 90) * 4;
  } else {
    return 7 + normalize(Math.min(sellerCount - 100, 400), 0, 400) * 3;
  }
}

/**
 * 计算价格离散度分数
 */
export function calculatePriceVarianceScore(prices: number[]): number {
  if (prices.length < 2) return 5; // 默认中等竞争

  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // 计算变异系数
  const cv = avgPrice > 0 ? stdDev / avgPrice : 0;

  // CV越大，价格竞争越激烈
  // CV < 0.1 = 低竞争 (0-3分)
  // CV 0.1-0.3 = 中等竞争 (3-7分)
  // CV > 0.3 = 高竞争 (7-10分)

  if (cv <= 0.1) {
    return normalize(cv, 0, 0.1) * 3;
  } else if (cv <= 0.3) {
    return 3 + normalize(cv - 0.1, 0, 0.2) * 4;
  } else {
    return 7 + normalize(Math.min(cv - 0.3, 0.2), 0, 0.2) * 3;
  }
}

/**
 * 计算市场集中度 (HHI指数)
 */
export function calculateHHIIndex(marketShares: number[]): number {
  // HHI = Σ(市场份额^2)
  // HHI越高，市场越集中，竞争越低
  const hhi = marketShares.reduce((sum, share) => sum + Math.pow(share * 100, 2), 0);

  // HHI范围: 0-10000
  // HHI < 1500 = 低集中度，高竞争 (7-10分)
  // HHI 1500-2500 = 中等集中度，中等竞争 (3-7分)
  // HHI > 2500 = 高集中度，低竞争 (0-3分)

  if (hhi < 1500) {
    return 7 + normalize(1500 - hhi, 0, 1500) * 3;
  } else if (hhi <= 2500) {
    return 3 + normalize(2500 - hhi, 0, 1000) * 4;
  } else {
    return normalize(Math.min(10000 - hhi, 7500), 0, 7500) * 3;
  }
}

/**
 * 计算评论数量分数
 */
export function calculateReviewScore(reviewCount: number): number {
  // 评论数越多，说明市场越成熟，竞争越激烈
  // 0-100条评论 = 低竞争 (0-3分)
  // 100-1000条评论 = 中等竞争 (3-7分)
  // 1000+条评论 = 高竞争 (7-10分)

  if (reviewCount <= 100) {
    return normalize(reviewCount, 0, 100) * 3;
  } else if (reviewCount <= 1000) {
    return 3 + normalize(reviewCount - 100, 0, 900) * 4;
  } else {
    return 7 + normalize(Math.min(reviewCount - 1000, 9000), 0, 9000) * 3;
  }
}

/**
 * 计算综合竞争度评分
 */
export function calculateCompetitionScore(
  product: Product,
  similarProducts: Product[] = []
): number {
  const weights = {
    sellerCount: 0.35,
    priceVariance: 0.25,
    marketConcentration: 0.25,
    reviewCount: 0.15,
  };

  // 卖家数量分数
  const sellerScore = calculateSellerCountScore(product.sellerCount);

  // 价格离散度分数
  const prices = similarProducts.length > 0
    ? similarProducts.map((p) => p.currentPrice)
    : [product.currentPrice];
  const priceScore = calculatePriceVarianceScore(prices);

  // 市场集中度分数（简化版，假设均匀分布）
  const marketShares = similarProducts.length > 0
    ? similarProducts.map(() => 1 / similarProducts.length)
    : [1];
  const concentrationScore = calculateHHIIndex(marketShares);

  // 评论数量分数
  const reviewScore = calculateReviewScore(product.reviewCount);

  // 综合评分
  const competitionScore =
    weights.sellerCount * sellerScore +
    weights.priceVariance * priceScore +
    weights.marketConcentration * concentrationScore +
    weights.reviewCount * reviewScore;

  return Math.round(competitionScore * 100) / 100;
}

/**
 * 判断市场饱和度
 */
export function isMarketSaturated(competitionScore: number): boolean {
  return competitionScore >= 7.5; // 竞争度超过7.5视为市场饱和
}

/**
 * 获取竞争等级
 */
export function getCompetitionLevel(
  competitionScore: number
): 'low' | 'medium' | 'high' {
  if (competitionScore < 3.5) return 'low';
  if (competitionScore < 7) return 'medium';
  return 'high';
}

/**
 * 批量计算竞争度评分
 */
export function batchCalculateCompetitionScores(
  products: Product[],
  categoryMap: Map<string, Product[]>
): Product[] {
  return products.map((product) => {
    const similarProducts = categoryMap.get(product.categoryId) || [];
    const competitionScore = calculateCompetitionScore(product, similarProducts);

    return {
      ...product,
      competitionScore,
    };
  });
}
