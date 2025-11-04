/**
 * 趋势评分算法
 */

import type { Product, TrendHistory } from '@/types';

/**
 * 归一化函数 (将值映射到0-1范围)
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * 计算搜索热度分数
 */
export function calculateSearchScore(searchVolume: number): number {
  // 使用对数缩放处理大范围的搜索量
  if (searchVolume <= 0) return 0;

  const logVolume = Math.log10(searchVolume + 1);
  // 假设搜索量范围: 1 - 1,000,000
  const maxLog = Math.log10(1000000);

  return normalize(logVolume, 0, maxLog) * 100;
}

/**
 * 计算销量增长分数
 */
export function calculateGrowthScore(history: TrendHistory[]): number {
  if (history.length < 2) return 0;

  // 按日期排序
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 计算最近7天和之前7天的平均销量排名
  const recent = sorted.slice(-7);
  const previous = sorted.slice(-14, -7);

  if (previous.length === 0) return 0;

  const recentAvg = recent.reduce((sum, h) => sum + h.salesRank, 0) / recent.length;
  const previousAvg = previous.reduce((sum, h) => sum + h.salesRank, 0) / previous.length;

  // 销量排名越低越好，所以增长率计算相反
  const growthRate = (previousAvg - recentAvg) / previousAvg;

  // 将增长率映射到0-100分
  // 增长率 > 50% = 100分
  // 增长率 < -50% = 0分
  return normalize(growthRate, -0.5, 0.5) * 100;
}

/**
 * 计算价格稳定性分数
 */
export function calculatePriceStability(history: TrendHistory[]): number {
  if (history.length < 2) return 50; // 默认中等稳定性

  const prices = history.map((h) => h.price);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  // 计算标准差
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // 计算变异系数 (CV)
  const cv = avgPrice > 0 ? stdDev / avgPrice : 0;

  // CV越小，价格越稳定
  // CV < 0.1 = 高稳定性 (100分)
  // CV > 0.5 = 低稳定性 (0分)
  return normalize(0.5 - cv, 0, 0.5) * 100;
}

/**
 * 计算综合趋势评分
 */
export function calculateTrendScore(
  product: Product,
  history: TrendHistory[] = []
): number {
  const weights = {
    search: 0.4,
    growth: 0.35,
    price: 0.15,
    newProduct: 0.1,
  };

  // 搜索热度分数
  const searchScore = calculateSearchScore(product.reviewCount); // 使用评论数作为热度指标

  // 销量增长分数
  const growthScore = calculateGrowthScore(history);

  // 价格稳定性分数
  const priceScore = calculatePriceStability(history);

  // 新品加成
  const isNew = isNewProduct(product);
  const newProductBonus = isNew ? 100 : 0;

  // 综合评分
  const trendScore =
    weights.search * searchScore +
    weights.growth * growthScore +
    weights.price * priceScore +
    weights.newProduct * newProductBonus;

  return Math.round(trendScore * 100) / 100;
}

/**
 * 判断是否为新品
 */
function isNewProduct(product: Product): boolean {
  const createdDate = new Date(product.createdAt);
  const now = new Date();
  const daysSinceCreated = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceCreated <= 30; // 30天内的商品视为新品
}

/**
 * 计算搜索量增长率
 */
export function calculateSearchGrowth(history: TrendHistory[]): number {
  if (history.length < 2) return 0;

  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recent = sorted.slice(-7);
  const previous = sorted.slice(-14, -7);

  if (previous.length === 0) return 0;

  const recentAvg = recent.reduce((sum, h) => sum + h.searchVolume, 0) / recent.length;
  const previousAvg = previous.reduce((sum, h) => sum + h.searchVolume, 0) / previous.length;

  if (previousAvg === 0) return 0;

  return ((recentAvg - previousAvg) / previousAvg) * 100;
}

/**
 * 检测新兴趋势
 */
export function detectEmergingTrend(history: TrendHistory[], threshold: number = 50): boolean {
  const growth = calculateSearchGrowth(history);
  return growth >= threshold;
}

/**
 * 批量计算趋势评分
 */
export function batchCalculateTrendScores(
  products: Product[],
  historyMap: Map<string, TrendHistory[]>
): Product[] {
  return products.map((product) => {
    const history = historyMap.get(product.id) || [];
    const trendScore = calculateTrendScore(product, history);

    return {
      ...product,
      trendScore,
    };
  });
}
