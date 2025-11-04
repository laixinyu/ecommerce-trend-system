/**
 * 推荐评分算法
 */

import type { Product, TrendHistory, RecommendationLevel } from '@/types';
import { calculateTrendScore } from './trend-scoring';
import { calculateCompetitionScore } from './competition-scoring';
import { calculateProfitMargin } from './profit-estimation';

/**
 * 计算综合推荐评分
 */
export function calculateRecommendationScore(
  product: Product,
  history: TrendHistory[] = [],
  similarProducts: Product[] = []
): number {
  const weights = {
    trend: 0.4,
    competition: 0.3,
    profit: 0.3,
  };

  // 趋势分数 (0-100)
  const trendScore = product.trendScore || calculateTrendScore(product, history);

  // 竞争度分数 (0-10，需要反转，因为竞争度越低越好)
  const competitionScore = product.competitionScore || calculateCompetitionScore(product, similarProducts);
  const invertedCompetitionScore = (10 - competitionScore) * 10; // 转换为0-100

  // 利润率分数 (转换为0-100)
  const { profitMargin } = calculateProfitMargin(product);
  const profitScore = Math.min(profitMargin * 2, 100); // 50%利润率 = 100分

  // 综合评分
  const recommendationScore =
    weights.trend * trendScore +
    weights.competition * invertedCompetitionScore +
    weights.profit * profitScore;

  return Math.round(recommendationScore * 100) / 100;
}

/**
 * 获取推荐等级
 */
export function getRecommendationLevel(score: number = 0): RecommendationLevel {
  if (!score || score < 0) return 'not_recommended';
  if (score >= 75) return 'highly_recommended';
  if (score >= 50) return 'worth_considering';
  return 'not_recommended';
}

/**
 * 生成推荐理由
 */
export function generateRecommendationReasons(
  product: Product,
  history: TrendHistory[] = [],
  similarProducts: Product[] = []
): string[] {
  const reasons: string[] = [];

  const trendScore = product.trendScore || calculateTrendScore(product, history);
  const competitionScore = product.competitionScore || calculateCompetitionScore(product, similarProducts);
  const { profitMargin, roi } = calculateProfitMargin(product);

  // 趋势相关理由
  if (trendScore >= 80) {
    reasons.push('🔥 趋势热度极高，市场需求旺盛');
  } else if (trendScore >= 60) {
    reasons.push('📈 趋势向好，具有增长潜力');
  } else if (trendScore < 40) {
    reasons.push('⚠️ 趋势较弱，市场需求不足');
  }

  // 竞争相关理由
  if (competitionScore <= 3) {
    reasons.push('✨ 竞争度低，市场机会大');
  } else if (competitionScore <= 6) {
    reasons.push('⚖️ 竞争适中，有一定市场空间');
  } else {
    reasons.push('🔴 竞争激烈，进入门槛高');
  }

  // 利润相关理由
  if (profitMargin >= 30) {
    reasons.push('💰 利润空间大，盈利能力强');
  } else if (profitMargin >= 20) {
    reasons.push('💵 利润空间合理');
  } else if (profitMargin >= 10) {
    reasons.push('⚠️ 利润空间较小');
  } else {
    reasons.push('❌ 利润空间不足，不建议进入');
  }

  // ROI相关理由
  if (roi >= 50) {
    reasons.push('📊 投资回报率高');
  }

  // 评分相关理由
  if (product.averageRating >= 4.5) {
    reasons.push('⭐ 用户评价优秀');
  }

  // 评论数相关理由
  if (product.reviewCount >= 1000) {
    reasons.push('👥 市场验证充分');
  } else if (product.reviewCount < 50) {
    reasons.push('🆕 市场验证不足，存在风险');
  }

  return reasons;
}

/**
 * 批量计算推荐评分
 */
export function batchCalculateRecommendations(
  products: Product[],
  historyMap: Map<string, TrendHistory[]>,
  categoryMap: Map<string, Product[]>
): Array<
  Product & {
    recommendationScore: number;
    recommendationLevel: RecommendationLevel;
    recommendationReasons: string[];
  }
> {
  return products.map((product) => {
    const history = historyMap.get(product.id) || [];
    const similarProducts = categoryMap.get(product.categoryId) || [];

    const recommendationScore = calculateRecommendationScore(product, history, similarProducts);
    const recommendationLevel = getRecommendationLevel(recommendationScore);
    const recommendationReasons = generateRecommendationReasons(
      product,
      history,
      similarProducts
    );

    return {
      ...product,
      recommendationScore,
      recommendationLevel,
      recommendationReasons,
    };
  });
}

/**
 * 过滤推荐商品
 */
export function filterRecommendedProducts(
  products: Product[],
  minScore: number = 50
): Product[] {
  return products.filter((product) => {
    const score = product.recommendationScore || 0;
    return score >= minScore;
  });
}

/**
 * 排序推荐商品
 */
export function sortByRecommendation(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const scoreA = a.recommendationScore || 0;
    const scoreB = b.recommendationScore || 0;
    return scoreB - scoreA;
  });
}

/**
 * 获取Top N推荐商品
 */
export function getTopRecommendations(products: Product[], n: number = 10): Product[] {
  const sorted = sortByRecommendation(products);
  return sorted.slice(0, n);
}
