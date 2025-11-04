import { createClient } from '@/lib/supabase/server';
import { ContentAsset, ContentMetrics, ContentAnalysis } from '@/types/content';
import { Logger } from '@/lib/utils/logger';

export class ContentAnalytics {
  /**
   * Calculate performance score for a content asset
   */
  static calculatePerformanceScore(metrics: ContentMetrics): number {
    // Weighted scoring algorithm
    const weights = {
      engagement_rate: 0.4,
      views: 0.2,
      likes: 0.15,
      comments: 0.15,
      shares: 0.1,
    };

    // Normalize metrics (assuming max values)
    const maxViews = 1000000;
    const maxLikes = 50000;
    const maxComments = 5000;
    const maxShares = 10000;
    const maxEngagement = 10; // 10% engagement rate

    const normalizedViews = Math.min(metrics.views / maxViews, 1);
    const normalizedLikes = Math.min(metrics.likes / maxLikes, 1);
    const normalizedComments = Math.min(metrics.comments / maxComments, 1);
    const normalizedShares = Math.min(metrics.shares / maxShares, 1);
    const normalizedEngagement = Math.min(metrics.engagement_rate / maxEngagement, 1);

    const score =
      normalizedEngagement * weights.engagement_rate +
      normalizedViews * weights.views +
      normalizedLikes * weights.likes +
      normalizedComments * weights.comments +
      normalizedShares * weights.shares;

    return Math.round(score * 100);
  }

  /**
   * Analyze content performance
   */
  static async analyzeContent(assetId: string, userId: string): Promise<ContentAnalysis> {
    const supabase = await createClient();

    // Get the asset
    const { data: asset, error } = await supabase
      .from('content_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', userId)
      .single();

    if (error || !asset) {
      throw new Error('Content asset not found');
    }

    const metrics = asset.metrics as ContentMetrics;
    const performanceScore = this.calculatePerformanceScore(metrics);

    // Identify best performing features
    const features: string[] = [];
    
    if (metrics.engagement_rate > 5) {
      features.push('High engagement rate');
    }
    if (metrics.views > 10000) {
      features.push('High reach');
    }
    if (metrics.shares > 100) {
      features.push('Highly shareable');
    }
    if (metrics.comments > 50) {
      features.push('Conversation starter');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (metrics.engagement_rate < 2) {
      recommendations.push('Consider more engaging content formats (videos, polls, stories)');
    }
    if (metrics.shares < 10) {
      recommendations.push('Add clear call-to-action to encourage sharing');
    }
    if (metrics.comments < 5) {
      recommendations.push('Ask questions to encourage audience interaction');
    }
    if (asset.tags.length < 3) {
      recommendations.push('Use more relevant hashtags to increase discoverability');
    }

    return {
      asset_id: assetId,
      performance_score: performanceScore,
      engagement_rate: metrics.engagement_rate,
      best_performing_features: features,
      recommendations,
    };
  }

  /**
   * Get top performing content
   */
  static async getTopPerformingContent(
    userId: string,
    limit: number = 10,
    platform?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ContentAsset[]> {
    const supabase = await createClient();

    let query = supabase
      .from('content_assets')
      .select('*')
      .eq('user_id', userId);

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: assets, error } = await query;

    if (error) throw error;

    if (!assets || assets.length === 0) {
      return [];
    }

    // Calculate performance scores and sort
    const assetsWithScores = assets.map((asset: any) => ({
      ...asset,
      performance_score: this.calculatePerformanceScore(asset.metrics),
    }));

    return assetsWithScores
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, limit);
  }

  /**
   * Identify common features in top performing content
   */
  static async identifySuccessPatterns(
    userId: string,
    topN: number = 20
  ): Promise<{
    commonTags: { tag: string; count: number }[];
    bestPlatforms: { platform: string; avgScore: number }[];
    bestContentTypes: { type: string; avgScore: number }[];
    insights: string[];
  }> {
    const topContent = await this.getTopPerformingContent(userId, topN);

    if (topContent.length === 0) {
      return {
        commonTags: [],
        bestPlatforms: [],
        bestContentTypes: [],
        insights: ['Not enough data to identify patterns'],
      };
    }

    // Analyze tags
    const tagCounts: Record<string, number> = {};
    topContent.forEach((asset: any) => {
      asset.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const commonTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Analyze platforms
    const platformScores: Record<string, number[]> = {};
    topContent.forEach((asset: any) => {
      if (!platformScores[asset.platform]) {
        platformScores[asset.platform] = [];
      }
      platformScores[asset.platform].push(
        this.calculatePerformanceScore(asset.metrics)
      );
    });

    const bestPlatforms = Object.entries(platformScores)
      .map(([platform, scores]) => ({
        platform,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Analyze content types
    const typeScores: Record<string, number[]> = {};
    topContent.forEach((asset: any) => {
      if (!typeScores[asset.type]) {
        typeScores[asset.type] = [];
      }
      typeScores[asset.type].push(
        this.calculatePerformanceScore(asset.metrics)
      );
    });

    const bestContentTypes = Object.entries(typeScores)
      .map(([type, scores]) => ({
        type,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Generate insights
    const insights: string[] = [];

    if (commonTags.length > 0) {
      insights.push(
        `Most effective hashtags: ${commonTags.slice(0, 3).map(t => `#${t.tag}`).join(', ')}`
      );
    }

    if (bestPlatforms.length > 0) {
      insights.push(
        `Best performing platform: ${bestPlatforms[0].platform} (avg score: ${Math.round(bestPlatforms[0].avgScore)})`
      );
    }

    if (bestContentTypes.length > 0) {
      insights.push(
        `Most engaging content type: ${bestContentTypes[0].type}`
      );
    }

    // Analyze engagement patterns
    const avgEngagement =
      topContent.reduce((sum, asset: any) => sum + asset.metrics.engagement_rate, 0) /
      topContent.length;
    insights.push(
      `Average engagement rate of top content: ${avgEngagement.toFixed(2)}%`
    );

    return {
      commonTags,
      bestPlatforms,
      bestContentTypes,
      insights,
    };
  }

  /**
   * Calculate content ROI
   */
  static async calculateContentROI(
    userId: string,
    assetId: string,
    adSpend?: number,
    revenue?: number
  ): Promise<{
    roi: number;
    costPerEngagement: number;
    revenuePerView: number;
  }> {
    const supabase = await createClient();

    const { data: asset, error } = await supabase
      .from('content_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', userId)
      .single();

    if (error || !asset) {
      throw new Error('Content asset not found');
    }

    const metrics = asset.metrics as ContentMetrics;
    const totalEngagements = metrics.likes + metrics.comments + metrics.shares;

    let roi = 0;
    let costPerEngagement = 0;
    let revenuePerView = 0;

    if (adSpend && adSpend > 0) {
      costPerEngagement = totalEngagements > 0 ? adSpend / totalEngagements : 0;
      
      if (revenue && revenue > 0) {
        roi = ((revenue - adSpend) / adSpend) * 100;
        revenuePerView = metrics.views > 0 ? revenue / metrics.views : 0;
      }
    }

    return {
      roi,
      costPerEngagement,
      revenuePerView,
    };
  }

  /**
   * Compare content with competitors (mock implementation)
   */
  static async compareWithCompetitors(
    userId: string,
    assetId: string,
    competitorData?: any[]
  ): Promise<{
    userPerformance: number;
    competitorAverage: number;
    ranking: string;
    insights: string[];
  }> {
    const analysis = await this.analyzeContent(assetId, userId);
    
    // Mock competitor data if not provided
    const mockCompetitorScores = competitorData?.map(c => c.score) || [
      65, 72, 58, 81, 69, 75, 63, 77, 70, 68
    ];

    const competitorAverage =
      mockCompetitorScores.reduce((sum, score) => sum + score, 0) /
      mockCompetitorScores.length;

    const betterThan = mockCompetitorScores.filter(
      score => analysis.performance_score > score
    ).length;
    const percentile = (betterThan / mockCompetitorScores.length) * 100;

    let ranking = 'Average';
    if (percentile >= 80) ranking = 'Top Performer';
    else if (percentile >= 60) ranking = 'Above Average';
    else if (percentile <= 20) ranking = 'Below Average';

    const insights: string[] = [];

    if (analysis.performance_score > competitorAverage) {
      insights.push(
        `Your content performs ${Math.round(((analysis.performance_score - competitorAverage) / competitorAverage) * 100)}% better than competitor average`
      );
    } else {
      insights.push(
        `Competitor content performs ${Math.round(((competitorAverage - analysis.performance_score) / competitorAverage) * 100)}% better on average`
      );
    }

    insights.push(`You rank in the top ${Math.round(100 - percentile)}% of analyzed content`);

    return {
      userPerformance: analysis.performance_score,
      competitorAverage: Math.round(competitorAverage),
      ranking,
      insights,
    };
  }

  /**
   * Get content performance trends over time
   */
  static async getPerformanceTrends(
    userId: string,
    platform?: string,
    days: number = 30
  ): Promise<{
    dates: string[];
    views: number[];
    engagement: number[];
    posts: number[];
  }> {
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('content_assets')
      .select('created_at, metrics')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: assets, error } = await query;

    if (error) throw error;

    // Group by date
    const dateMap: Record<string, { views: number; engagement: number; count: number }> = {};

    assets?.forEach((asset: any) => {
      const date = new Date(asset.created_at).toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { views: 0, engagement: 0, count: 0 };
      }
      dateMap[date].views += asset.metrics.views || 0;
      dateMap[date].engagement += asset.metrics.engagement_rate || 0;
      dateMap[date].count += 1;
    });

    const dates = Object.keys(dateMap).sort();
    const views = dates.map(date => dateMap[date].views);
    const engagement = dates.map(date => 
      dateMap[date].count > 0 ? dateMap[date].engagement / dateMap[date].count : 0
    );
    const posts = dates.map(date => dateMap[date].count);

    return {
      dates,
      views,
      engagement,
      posts,
    };
  }
}
