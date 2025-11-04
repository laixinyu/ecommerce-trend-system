/**
 * 报告生成器 - 基于真实数据生成分析报告
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { calculateProfitMargin } from './profit-estimation';

export interface ReportParams {
  categories?: string[];
  platforms?: string[];
  dateRange: number; // 天数
  template: 'trend-overview' | 'category-analysis' | 'competition-analysis';
}

export interface ReportData {
  // 基础统计
  summary: {
    totalProducts: number;
    avgGrowthRate: number;
    hotCategories: number;
    recommendedProducts: number;
  };

  // 市场概况
  marketOverview: {
    platformDistribution: { platform: string; count: number; percentage: number }[];
    priceRanges: { range: string; count: number; avgPrice: number }[];
    ratingDistribution: { range: string; count: number }[];
  };

  // 趋势分析
  trendAnalysis: {
    highTrendProducts: number;
    mediumTrendProducts: number;
    lowTrendProducts: number;
    avgTrendScore: number;
    trendingCategories: { category: string; avgScore: number; count: number }[];
  };

  // 竞争分析
  competitionAnalysis: {
    lowCompetition: number;
    mediumCompetition: number;
    highCompetition: number;
    avgCompetitionScore: number;
    competitionByPlatform: { platform: string; avgScore: number }[];
  };

  // 利润分析（经营决策核心）
  profitAnalysis: {
    avgProfitMargin: number;
    highProfitProducts: number; // >30%
    mediumProfitProducts: number; // 20-30%
    lowProfitProducts: number; // <20%
    avgROI: number;
    profitByCategory: { category: string; avgMargin: number; count: number }[];
  };

  // 机会识别
  opportunities: {
    blueOcean: number; // 高趋势+低竞争
    quickWins: number; // 高利润+低竞争
    risky: number; // 低利润+高竞争
    topOpportunities: Array<{
      id: string;
      name: string;
      platform: string;
      trendScore: number;
      competitionScore: number;
      profitMargin: number;
      reason: string;
    }>;
  };

  // 风险评估
  risks: {
    highRiskProducts: number;
    saturatedMarkets: string[];
    lowMarginCategories: string[];
    warnings: string[];
  };

  // 推荐建议
  recommendations: {
    topProducts: Array<{
      id: string;
      name: string;
      platform: string;
      score: number;
      reasons: string[];
    }>;
    avoidCategories: string[];
    pricingStrategy: string;
    entryStrategy: string;
  };
}

export async function generateReport(params: ReportParams): Promise<ReportData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // 构建查询条件
  let query = supabase.from('products').select('*');

  // 应用平台筛选
  if (params.platforms && params.platforms.length > 0) {
    query = query.in('platform', params.platforms);
  }

  // 应用类目筛选（如果有）
  // 注意：当前数据库可能没有类目数据，这里先跳过

  // 应用时间范围筛选
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - params.dateRange);
  query = query.gte('created_at', dateThreshold.toISOString());

  // 获取数据
  const { data: products, error } = await query;

  if (error || !products) {
    throw new Error('Failed to fetch products data');
  }

  // 如果没有数据，返回空报告
  if (products.length === 0) {
    return createEmptyReport();
  }

  // 开始分析
  return analyzeProducts(products, params);
}

function analyzeProducts(products: any[], params: ReportParams): ReportData {
  const totalProducts = products.length;

  // 1. 基础统计
  const summary = calculateSummary(products);

  // 2. 市场概况
  const marketOverview = analyzeMarketOverview(products);

  // 3. 趋势分析
  const trendAnalysis = analyzeTrends(products);

  // 4. 竞争分析
  const competitionAnalysis = analyzeCompetition(products);

  // 5. 利润分析
  const profitAnalysis = analyzeProfits(products);

  // 6. 机会识别
  const opportunities = identifyOpportunities(products);

  // 7. 风险评估
  const risks = assessRisks(products);

  // 8. 生成推荐
  const recommendations = generateRecommendations(products, opportunities, risks);

  return {
    summary,
    marketOverview,
    trendAnalysis,
    competitionAnalysis,
    profitAnalysis,
    opportunities,
    risks,
    recommendations,
  };
}

function calculateSummary(products: any[]) {
  const totalProducts = products.length;
  
  // 计算平均增长率（基于趋势分数）
  const avgTrendScore = products.reduce((sum, p) => sum + (p.trend_score || 0), 0) / totalProducts;
  const avgGrowthRate = Math.round((avgTrendScore / 100) * 50); // 转换为百分比

  // 热门类目数量（趋势分数>60的不同类目）
  const hotCategories = new Set(
    products.filter(p => (p.trend_score || 0) > 60).map(p => p.category_id)
  ).size;

  // 推荐商品数量（推荐分数>75）
  const recommendedProducts = products.filter(p => (p.recommendation_score || 0) >= 75).length;

  return {
    totalProducts,
    avgGrowthRate,
    hotCategories,
    recommendedProducts,
  };
}

function analyzeMarketOverview(products: any[]) {
  // 平台分布
  const platformCounts = products.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformDistribution = Object.entries(platformCounts).map(([platform, count]) => ({
    platform,
    count,
    percentage: Math.round((count / products.length) * 100),
  }));

  // 价格区间分布
  const priceRanges = [
    { range: '$0-$20', min: 0, max: 20 },
    { range: '$20-$50', min: 20, max: 50 },
    { range: '$50-$100', min: 50, max: 100 },
    { range: '$100-$200', min: 100, max: 200 },
    { range: '$200+', min: 200, max: Infinity },
  ];

  const priceDistribution = priceRanges.map(({ range, min, max }) => {
    const inRange = products.filter(p => {
      const price = p.current_price || 0;
      return price >= min && price < max;
    });
    const avgPrice = inRange.length > 0
      ? inRange.reduce((sum, p) => sum + (p.current_price || 0), 0) / inRange.length
      : 0;
    return {
      range,
      count: inRange.length,
      avgPrice: Math.round(avgPrice * 100) / 100,
    };
  });

  // 评分分布
  const ratingRanges = [
    { range: '4.5-5.0', min: 4.5, max: 5.0 },
    { range: '4.0-4.5', min: 4.0, max: 4.5 },
    { range: '3.5-4.0', min: 3.5, max: 4.0 },
    { range: '3.0-3.5', min: 3.0, max: 3.5 },
    { range: '<3.0', min: 0, max: 3.0 },
  ];

  const ratingDistribution = ratingRanges.map(({ range, min, max }) => ({
    range,
    count: products.filter(p => {
      const rating = p.average_rating || 0;
      return rating >= min && rating < max;
    }).length,
  }));

  return {
    platformDistribution,
    priceRanges: priceDistribution,
    ratingDistribution,
  };
}

function analyzeTrends(products: any[]) {
  const highTrendProducts = products.filter(p => (p.trend_score || 0) >= 70).length;
  const mediumTrendProducts = products.filter(p => {
    const score = p.trend_score || 0;
    return score >= 40 && score < 70;
  }).length;
  const lowTrendProducts = products.filter(p => (p.trend_score || 0) < 40).length;

  const avgTrendScore = products.reduce((sum, p) => sum + (p.trend_score || 0), 0) / products.length;

  // 按类目统计趋势（如果有类目数据）
  const categoryTrends = products.reduce((acc, p) => {
    const cat = p.category_id || 'unknown';
    if (!acc[cat]) {
      acc[cat] = { scores: [], count: 0 };
    }
    acc[cat].scores.push(p.trend_score || 0);
    acc[cat].count++;
    return acc;
  }, {} as Record<string, { scores: number[]; count: number }>);

  const trendingCategories = Object.entries(categoryTrends)
    .map(([category, data]) => ({
      category,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  return {
    highTrendProducts,
    mediumTrendProducts,
    lowTrendProducts,
    avgTrendScore: Math.round(avgTrendScore * 100) / 100,
    trendingCategories,
  };
}

function analyzeCompetition(products: any[]) {
  const lowCompetition = products.filter(p => (p.competition_score || 0) <= 3).length;
  const mediumCompetition = products.filter(p => {
    const score = p.competition_score || 0;
    return score > 3 && score <= 7;
  }).length;
  const highCompetition = products.filter(p => (p.competition_score || 0) > 7).length;

  const avgCompetitionScore = products.reduce((sum, p) => sum + (p.competition_score || 0), 0) / products.length;

  // 按平台统计竞争度
  const platformCompetition = products.reduce((acc, p) => {
    if (!acc[p.platform]) {
      acc[p.platform] = { scores: [], count: 0 };
    }
    acc[p.platform].scores.push(p.competition_score || 0);
    acc[p.platform].count++;
    return acc;
  }, {} as Record<string, { scores: number[]; count: number }>);

  const competitionByPlatform = Object.entries(platformCompetition).map(([platform, data]) => ({
    platform,
    avgScore: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.count) * 100) / 100,
  }));

  return {
    lowCompetition,
    mediumCompetition,
    highCompetition,
    avgCompetitionScore: Math.round(avgCompetitionScore * 100) / 100,
    competitionByPlatform,
  };
}

function analyzeProfits(products: any[]) {
  const profitData = products.map(p => {
    const profit = calculateProfitMargin({
      currentPrice: p.current_price || 0,
      platform: p.platform,
    } as any);
    return { ...p, ...profit };
  });

  const avgProfitMargin = profitData.reduce((sum, p) => sum + p.profitMargin, 0) / profitData.length;
  const avgROI = profitData.reduce((sum, p) => sum + p.roi, 0) / profitData.length;

  const highProfitProducts = profitData.filter(p => p.profitMargin >= 30).length;
  const mediumProfitProducts = profitData.filter(p => p.profitMargin >= 20 && p.profitMargin < 30).length;
  const lowProfitProducts = profitData.filter(p => p.profitMargin < 20).length;

  // 按类目统计利润
  const categoryProfits = profitData.reduce((acc, p) => {
    const cat = p.category_id || 'unknown';
    if (!acc[cat]) {
      acc[cat] = { margins: [], count: 0 };
    }
    acc[cat].margins.push(p.profitMargin);
    acc[cat].count++;
    return acc;
  }, {} as Record<string, { margins: number[]; count: number }>);

  const profitByCategory = Object.entries(categoryProfits)
    .map(([category, data]) => ({
      category,
      avgMargin: Math.round((data.margins.reduce((a, b) => a + b, 0) / data.count) * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.avgMargin - a.avgMargin)
    .slice(0, 5);

  return {
    avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
    highProfitProducts,
    mediumProfitProducts,
    lowProfitProducts,
    avgROI: Math.round(avgROI * 100) / 100,
    profitByCategory,
  };
}

function identifyOpportunities(products: any[]) {
  const profitData = products.map(p => {
    const profit = calculateProfitMargin({
      currentPrice: p.current_price || 0,
      platform: p.platform,
    } as any);
    return { ...p, ...profit };
  });

  // 蓝海市场：高趋势(>60) + 低竞争(<3)
  const blueOcean = profitData.filter(p =>
    (p.trend_score || 0) > 60 && (p.competition_score || 0) < 3
  ).length;

  // 快速获胜：高利润(>30%) + 低竞争(<3)
  const quickWins = profitData.filter(p =>
    p.profitMargin > 30 && (p.competition_score || 0) < 3
  ).length;

  // 高风险：低利润(<20%) + 高竞争(>7)
  const risky = profitData.filter(p =>
    p.profitMargin < 20 && (p.competition_score || 0) > 7
  ).length;

  // Top机会商品
  const scoredProducts = profitData.map(p => {
    // 综合评分：趋势分数 + (10-竞争度)*10 + 利润率*2
    const opportunityScore =
      (p.trend_score || 0) +
      (10 - (p.competition_score || 0)) * 10 +
      p.profitMargin * 2;

    let reason = '';
    if ((p.trend_score || 0) > 60 && (p.competition_score || 0) < 3) {
      reason = '蓝海市场：高需求低竞争';
    } else if (p.profitMargin > 30 && (p.competition_score || 0) < 3) {
      reason = '高利润低竞争';
    } else if ((p.trend_score || 0) > 70) {
      reason = '市场热度高';
    } else if (p.profitMargin > 35) {
      reason = '利润空间大';
    } else {
      reason = '综合表现良好';
    }

    return {
      ...p,
      opportunityScore,
      reason,
    };
  });

  const topOpportunities = scoredProducts
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 10)
    .map(p => ({
      id: p.id,
      name: p.name,
      platform: p.platform,
      trendScore: p.trend_score || 0,
      competitionScore: p.competition_score || 0,
      profitMargin: Math.round(p.profitMargin * 100) / 100,
      reason: p.reason,
    }));

  return {
    blueOcean,
    quickWins,
    risky,
    topOpportunities,
  };
}

function assessRisks(products: any[]) {
  const profitData = products.map(p => {
    const profit = calculateProfitMargin({
      currentPrice: p.current_price || 0,
      platform: p.platform,
    } as any);
    return { ...p, ...profit };
  });

  // 高风险商品：低利润+高竞争 或 低趋势+高竞争
  const highRiskProducts = profitData.filter(p =>
    (p.profitMargin < 15 && (p.competition_score || 0) > 7) ||
    ((p.trend_score || 0) < 30 && (p.competition_score || 0) > 7)
  ).length;

  // 饱和市场：竞争度>8的类目
  const categoryCompetition = profitData.reduce((acc, p) => {
    const cat = p.category_id || 'unknown';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(p.competition_score || 0);
    return acc;
  }, {} as Record<string, number[]>);

  const saturatedMarkets = Object.entries(categoryCompetition)
    .filter(([_, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return avg > 8;
    })
    .map(([cat]) => cat);

  // 低利润类目：平均利润率<15%
  const categoryProfits = profitData.reduce((acc, p) => {
    const cat = p.category_id || 'unknown';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(p.profitMargin);
    return acc;
  }, {} as Record<string, number[]>);

  const lowMarginCategories = Object.entries(categoryProfits)
    .filter(([_, margins]) => {
      const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
      return avg < 15;
    })
    .map(([cat]) => cat);

  // 生成警告
  const warnings: string[] = [];
  if (highRiskProducts > products.length * 0.3) {
    warnings.push(`${Math.round((highRiskProducts / products.length) * 100)}% 的商品处于高风险状态（低利润或低趋势+高竞争）`);
  }
  if (saturatedMarkets.length > 0) {
    warnings.push(`发现 ${saturatedMarkets.length} 个饱和市场，竞争激烈`);
  }
  if (lowMarginCategories.length > 0) {
    warnings.push(`${lowMarginCategories.length} 个类目利润空间不足`);
  }

  return {
    highRiskProducts,
    saturatedMarkets,
    lowMarginCategories,
    warnings,
  };
}

function generateRecommendations(products: any[], opportunities: any, risks: any) {
  const profitData = products.map(p => {
    const profit = calculateProfitMargin({
      currentPrice: p.current_price || 0,
      platform: p.platform,
    } as unknown);
    return { ...p, ...profit };
  });

  // Top推荐商品（基于综合评分）
  const topProducts = profitData
    .map(p => {
      const score = (p.recommendation_score || 0);
      const reasons: string[] = [];

      if ((p.trend_score || 0) >= 70) reasons.push('市场热度高');
      if ((p.competition_score || 0) <= 3) reasons.push('竞争度低');
      if (p.profitMargin >= 30) reasons.push('利润空间大');
      if ((p.average_rating || 0) >= 4.5) reasons.push('用户评价好');
      if ((p.review_count || 0) >= 100) reasons.push('市场验证充分');

      return {
        id: p.id,
        name: p.name,
        platform: p.platform,
        score,
        reasons,
      };
    })
    .filter(p => p.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // 应避免的类目
  const avoidCategories = [...risks.saturatedMarkets, ...risks.lowMarginCategories];

  // 定价策略
  const avgPrice = products.reduce((sum, p) => sum + (p.current_price || 0), 0) / products.length;
  let pricingStrategy = '';
  if (avgPrice < 30) {
    pricingStrategy = '低价策略：适合走量，注意控制成本';
  } else if (avgPrice < 100) {
    pricingStrategy = '中价策略：平衡利润和销量，关注性价比';
  } else {
    pricingStrategy = '高价策略：注重品质和品牌，提供优质服务';
  }

  // 进入策略
  const avgCompetition = products.reduce((sum, p) => sum + (p.competition_score || 0), 0) / products.length;
  let entryStrategy = '';
  if (avgCompetition < 3) {
    entryStrategy = '市场机会大，建议快速进入抢占市场';
  } else if (avgCompetition < 7) {
    entryStrategy = '竞争适中，建议做好差异化定位';
  } else {
    entryStrategy = '竞争激烈，建议寻找细分市场或提升产品竞争力';
  }

  return {
    topProducts,
    avoidCategories: [...new Set(avoidCategories)],
    pricingStrategy,
    entryStrategy,
  };
}

function createEmptyReport(): ReportData {
  return {
    summary: {
      totalProducts: 0,
      avgGrowthRate: 0,
      hotCategories: 0,
      recommendedProducts: 0,
    },
    marketOverview: {
      platformDistribution: [],
      priceRanges: [],
      ratingDistribution: [],
    },
    trendAnalysis: {
      highTrendProducts: 0,
      mediumTrendProducts: 0,
      lowTrendProducts: 0,
      avgTrendScore: 0,
      trendingCategories: [],
    },
    competitionAnalysis: {
      lowCompetition: 0,
      mediumCompetition: 0,
      highCompetition: 0,
      avgCompetitionScore: 0,
      competitionByPlatform: [],
    },
    profitAnalysis: {
      avgProfitMargin: 0,
      highProfitProducts: 0,
      mediumProfitProducts: 0,
      lowProfitProducts: 0,
      avgROI: 0,
      profitByCategory: [],
    },
    opportunities: {
      blueOcean: 0,
      quickWins: 0,
      risky: 0,
      topOpportunities: [],
    },
    risks: {
      highRiskProducts: 0,
      saturatedMarkets: [],
      lowMarginCategories: [],
      warnings: ['没有足够的数据生成报告'],
    },
    recommendations: {
      topProducts: [],
      avoidCategories: [],
      pricingStrategy: '数据不足',
      entryStrategy: '数据不足',
    },
  };
}
