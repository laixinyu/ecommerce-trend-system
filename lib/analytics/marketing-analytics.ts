// 营销分析引擎
import { createClient } from '@/lib/supabase/server';

export interface ROASMetrics {
  platform: string;
  campaignId: string;
  campaignName: string;
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  cpa: number;
  roi: number;
}

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
}

export interface ConversionFunnel {
  stages: ConversionFunnelStage[];
  overallConversionRate: number;
  totalVisitors: number;
  totalConversions: number;
}

export interface CampaignComparison {
  campaignId: string;
  campaignName: string;
  platform: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    conversions: number;
    conversionRate: number;
    cpa: number;
    roas: number;
  };
  rank: number;
}

/**
 * 营销分析引擎
 * 提供ROAS计算、转化漏斗分析、广告效果对比等功能
 */
export class MarketingAnalytics {
  /**
   * 计算跨平台ROAS
   * @param userId 用户ID
   * @param dateRange 日期范围
   */
  async calculateCrossPlatformROAS(
    userId: string,
    dateRange?: {
      startDate: string;
      endDate: string;
    }
  ): Promise<ROASMetrics[]> {
    const supabase = await createClient();

    // 获取所有广告活动数据
    let query = supabase
      .from('ad_campaigns')
      .select(
        `
        *,
        integrations!inner(
          user_id
        )
      `
      )
      .eq('integrations.user_id', userId);

    // 如果有日期范围，可以添加过滤（需要在metrics中存储日期）
    // 这里简化处理，使用updated_at作为参考
    if (dateRange) {
      query = query
        .gte('updated_at', dateRange.startDate)
        .lte('updated_at', dateRange.endDate);
    }

    const { data: campaigns, error } = await query;

    if (error || !campaigns) {
      throw new Error('Failed to fetch campaign data');
    }

    // 计算每个广告活动的ROAS
    const roasMetrics: ROASMetrics[] = campaigns.map((campaign) => {
      const metrics = campaign.metrics as Record<string, number>;
      const spend = metrics.spend || metrics.cost || 0;
      const revenue = metrics.conversion_value || 0;
      const conversions = metrics.conversions || 0;

      const roas = spend > 0 ? revenue / spend : 0;
      const cpa = conversions > 0 ? spend / conversions : 0;
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

      return {
        platform: campaign.platform,
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name || 'Unknown',
        spend,
        revenue,
        roas,
        conversions,
        cpa,
        roi,
      };
    });

    // 按ROAS降序排序
    return roasMetrics.sort((a, b) => b.roas - a.roas);
  }

  /**
   * 获取平台汇总ROAS
   * @param userId 用户ID
   */
  async getPlatformROASSummary(userId: string): Promise<
    Array<{
      platform: string;
      totalSpend: number;
      totalRevenue: number;
      averageROAS: number;
      totalConversions: number;
      campaignCount: number;
    }>
  > {
    const roasMetrics = await this.calculateCrossPlatformROAS(userId);

    // 按平台分组
    const platformGroups = roasMetrics.reduce(
      (acc, metric) => {
        if (!acc[metric.platform]) {
          acc[metric.platform] = [];
        }
        acc[metric.platform].push(metric);
        return acc;
      },
      {} as Record<string, ROASMetrics[]>
    );

    // 计算每个平台的汇总数据
    return Object.entries(platformGroups).map(([platform, metrics]) => {
      const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0);
      const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
      const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
      const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

      return {
        platform,
        totalSpend,
        totalRevenue,
        averageROAS,
        totalConversions,
        campaignCount: metrics.length,
      };
    });
  }

  /**
   * 分析转化漏斗
   * @param userId 用户ID
   * @param funnelData 漏斗数据（从外部分析工具获取）
   */
  analyzeConversionFunnel(funnelData: {
    visitors: number;
    productViews: number;
    addToCarts: number;
    checkouts: number;
    purchases: number;
  }): ConversionFunnel {
    const { visitors, productViews, addToCarts, checkouts, purchases } =
      funnelData;

    const stages: ConversionFunnelStage[] = [
      {
        stage: 'Visitors',
        count: visitors,
        percentage: 100,
        dropoffRate: 0,
      },
      {
        stage: 'Product Views',
        count: productViews,
        percentage: visitors > 0 ? (productViews / visitors) * 100 : 0,
        dropoffRate:
          visitors > 0 ? ((visitors - productViews) / visitors) * 100 : 0,
      },
      {
        stage: 'Add to Cart',
        count: addToCarts,
        percentage: visitors > 0 ? (addToCarts / visitors) * 100 : 0,
        dropoffRate:
          productViews > 0
            ? ((productViews - addToCarts) / productViews) * 100
            : 0,
      },
      {
        stage: 'Checkout',
        count: checkouts,
        percentage: visitors > 0 ? (checkouts / visitors) * 100 : 0,
        dropoffRate:
          addToCarts > 0 ? ((addToCarts - checkouts) / addToCarts) * 100 : 0,
      },
      {
        stage: 'Purchase',
        count: purchases,
        percentage: visitors > 0 ? (purchases / visitors) * 100 : 0,
        dropoffRate:
          checkouts > 0 ? ((checkouts - purchases) / checkouts) * 100 : 0,
      },
    ];

    const overallConversionRate =
      visitors > 0 ? (purchases / visitors) * 100 : 0;

    return {
      stages,
      overallConversionRate,
      totalVisitors: visitors,
      totalConversions: purchases,
    };
  }

  /**
   * 对比广告活动效果
   * @param userId 用户ID
   * @param campaignIds 要对比的广告活动ID列表
   */
  async compareCampaigns(
    userId: string,
    campaignIds?: string[]
  ): Promise<CampaignComparison[]> {
    const supabase = await createClient();

    // 构建查询
    let query = supabase
      .from('ad_campaigns')
      .select(
        `
        *,
        integrations!inner(
          user_id
        )
      `
      )
      .eq('integrations.user_id', userId);

    // 如果指定了广告活动ID，只查询这些活动
    if (campaignIds && campaignIds.length > 0) {
      query = query.in('campaign_id', campaignIds);
    }

    const { data: campaigns, error } = await query;

    if (error || !campaigns) {
      throw new Error('Failed to fetch campaign data');
    }

    // 计算每个广告活动的指标
    const comparisons: CampaignComparison[] = campaigns.map((campaign) => {
      const metrics = campaign.metrics as Record<string, number>;
      const impressions = metrics.impressions || 0;
      const clicks = metrics.clicks || 0;
      const spend = metrics.spend || metrics.cost || 0;
      const conversions = metrics.conversions || 0;
      const revenue = metrics.conversion_value || 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const cpa = conversions > 0 ? spend / conversions : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name || 'Unknown',
        platform: campaign.platform,
        metrics: {
          impressions,
          clicks,
          ctr,
          spend,
          conversions,
          conversionRate,
          cpa,
          roas,
        },
        rank: 0, // 将在排序后设置
      };
    });

    // 按ROAS排序并设置排名
    comparisons.sort((a, b) => b.metrics.roas - a.metrics.roas);
    comparisons.forEach((comparison, index) => {
      comparison.rank = index + 1;
    });

    return comparisons;
  }

  /**
   * 识别最佳表现广告
   * @param userId 用户ID
   * @param metric 评估指标 (roas, ctr, conversion_rate)
   * @param limit 返回数量
   */
  async identifyTopPerformingAds(
    userId: string,
    metric: 'roas' | 'ctr' | 'conversion_rate' = 'roas',
    limit: number = 10
  ): Promise<CampaignComparison[]> {
    const comparisons = await this.compareCampaigns(userId);

    // 根据指定指标排序
    let sorted: CampaignComparison[];
    switch (metric) {
      case 'roas':
        sorted = comparisons.sort((a, b) => b.metrics.roas - a.metrics.roas);
        break;
      case 'ctr':
        sorted = comparisons.sort((a, b) => b.metrics.ctr - a.metrics.ctr);
        break;
      case 'conversion_rate':
        sorted = comparisons.sort(
          (a, b) => b.metrics.conversionRate - a.metrics.conversionRate
        );
        break;
      default:
        sorted = comparisons;
    }

    // 重新设置排名
    sorted.forEach((comparison, index) => {
      comparison.rank = index + 1;
    });

    return sorted.slice(0, limit);
  }

  /**
   * 计算广告支出趋势
   * @param userId 用户ID
   * @param days 天数
   */
  async calculateSpendTrend(
    userId: string,
    days: number = 30
  ): Promise<
    Array<{
      date: string;
      totalSpend: number;
      metaSpend: number;
      googleSpend: number;
      campaignCount: number;
    }>
  > {
    const supabase = await createClient();

    // 获取指定天数内的广告活动数据
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: campaigns, error } = await supabase
      .from('ad_campaigns')
      .select(
        `
        *,
        integrations!inner(
          user_id
        )
      `
      )
      .eq('integrations.user_id', userId)
      .gte('updated_at', startDate);

    if (error || !campaigns) {
      throw new Error('Failed to fetch campaign data');
    }

    // 按日期分组（这里简化处理，实际应该从metrics中的日期数据分组）
    // 由于我们的数据结构没有按日存储，这里返回汇总数据
    const totalSpend = campaigns.reduce((sum, campaign) => {
      const metrics = campaign.metrics as Record<string, number>;
      return sum + (metrics.spend || metrics.cost || 0);
    }, 0);

    const metaSpend = campaigns
      .filter((c) => c.platform === 'meta')
      .reduce((sum, campaign) => {
        const metrics = campaign.metrics as Record<string, number>;
        return sum + (metrics.spend || metrics.cost || 0);
      }, 0);

    const googleSpend = campaigns
      .filter((c) => c.platform === 'google')
      .reduce((sum, campaign) => {
        const metrics = campaign.metrics as Record<string, number>;
        return sum + (metrics.spend || metrics.cost || 0);
      }, 0);

    // 返回汇总数据（实际应该按日期分组）
    return [
      {
        date: new Date().toISOString().split('T')[0],
        totalSpend,
        metaSpend,
        googleSpend,
        campaignCount: campaigns.length,
      },
    ];
  }
}

// 导出单例实例
export const marketingAnalytics = new MarketingAnalytics();
