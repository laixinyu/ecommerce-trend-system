/**
 * 利润空间估算算法
 */

import type { Product, Platform } from '@/types';

/**
 * 平台费用率配置
 */
const PLATFORM_FEE_RATES: Record<Platform, number> = {
  amazon: 0.15, // 15%
  aliexpress: 0.08, // 8%
  ebay: 0.12, // 12%
  taobao: 0.05, // 5%
  pinduoduo: 0.06, // 6%
};

/**
 * 估算商品成本
 */
export function estimateProductCost(product: Product): number {
  const { currentPrice, platform } = product;

  // 基于价格区间的成本估算比例
  let costRatio: number;

  if (currentPrice < 50) {
    costRatio = 0.4; // 低价商品，成本约40%
  } else if (currentPrice < 200) {
    costRatio = 0.5; // 中价商品，成本约50%
  } else if (currentPrice < 500) {
    costRatio = 0.55; // 中高价商品，成本约55%
  } else {
    costRatio = 0.6; // 高价商品，成本约60%
  }

  // 不同平台的成本调整
  const platformAdjustment: Record<Platform, number> = {
    amazon: 1.0,
    aliexpress: 0.7, // AliExpress通常成本更低
    ebay: 0.9,
    taobao: 0.6, // 淘宝成本较低
    pinduoduo: 0.5, // 拼多多成本最低
  };

  const estimatedCost = currentPrice * costRatio * platformAdjustment[platform];

  return Math.round(estimatedCost * 100) / 100;
}

/**
 * 计算平台费用
 */
export function calculatePlatformFee(product: Product): number {
  const { currentPrice, platform } = product;
  const feeRate = PLATFORM_FEE_RATES[platform] || 0.1;

  return Math.round(currentPrice * feeRate * 100) / 100;
}

/**
 * 估算物流成本
 */
export function estimateShippingCost(product: Product): number {
  const { currentPrice, platform } = product;

  // 基于价格和平台的物流成本估算
  let shippingCost: number;

  if (platform === 'aliexpress') {
    // 跨境物流成本较高
    if (currentPrice < 50) {
      shippingCost = 15;
    } else if (currentPrice < 200) {
      shippingCost = 25;
    } else {
      shippingCost = 40;
    }
  } else if (platform === 'amazon') {
    // Amazon FBA费用
    if (currentPrice < 50) {
      shippingCost = 8;
    } else if (currentPrice < 200) {
      shippingCost = 12;
    } else {
      shippingCost = 18;
    }
  } else {
    // 国内物流
    if (currentPrice < 50) {
      shippingCost = 5;
    } else if (currentPrice < 200) {
      shippingCost = 8;
    } else {
      shippingCost = 12;
    }
  }

  return Math.round(shippingCost * 100) / 100;
}

/**
 * 计算利润空间
 */
export function calculateProfitMargin(product: Product): {
  revenue: number;
  cost: number;
  platformFee: number;
  shippingCost: number;
  profit: number;
  profitMargin: number;
  roi: number;
} {
  const revenue = product.currentPrice;
  const cost = estimateProductCost(product);
  const platformFee = calculatePlatformFee(product);
  const shippingCost = estimateShippingCost(product);

  const profit = revenue - cost - platformFee - shippingCost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    revenue: Math.round(revenue * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    roi: Math.round(roi * 100) / 100,
  };
}

/**
 * 判断利润空间是否合理
 */
export function isProfitMarginReasonable(profitMargin: number): boolean {
  return profitMargin >= 20; // 利润率至少20%
}

/**
 * 获取利润等级
 */
export function getProfitLevel(profitMargin: number): 'low' | 'medium' | 'high' {
  if (profitMargin < 15) return 'low';
  if (profitMargin < 30) return 'medium';
  return 'high';
}

/**
 * 批量计算利润空间
 */
export function batchCalculateProfitMargins(products: Product[]): Array<
  Product & {
    profitAnalysis: ReturnType<typeof calculateProfitMargin>;
  }
> {
  return products.map((product) => ({
    ...product,
    profitAnalysis: calculateProfitMargin(product),
  }));
}

/**
 * 计算盈亏平衡点
 */
export function calculateBreakEvenPoint(product: Product): {
  breakEvenUnits: number;
  breakEvenRevenue: number;
} {
  const { cost, platformFee, shippingCost, profit } = calculateProfitMargin(product);

  if (profit <= 0) {
    return {
      breakEvenUnits: Infinity,
      breakEvenRevenue: Infinity,
    };
  }

  // 假设固定成本为0（无货源模式）
  const fixedCost = 0;
  const unitProfit = profit;

  const breakEvenUnits = Math.ceil(fixedCost / unitProfit);
  const breakEvenRevenue = breakEvenUnits * product.currentPrice;

  return {
    breakEvenUnits,
    breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
  };
}
