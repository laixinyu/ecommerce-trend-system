import { createClient } from '@/lib/supabase/server';
import { MetaInsightsClient } from '../clients/meta-insights-client';
import { TikTokAnalyticsClient } from '../clients/tiktok-analytics-client';
import { Encryption } from '@/lib/security/encryption';
import { Logger } from '@/lib/utils/logger';
import { SocialMediaPost, ContentAsset } from '@/types/content';

export class ContentSyncService {
  /**
   * Sync content data from all connected platforms
   */
  static async syncAllPlatforms(userId: string): Promise<{
    success: boolean;
    synced: number;
    errors: string[];
  }> {
    const supabase = await createClient();
    const errors: string[] = [];
    let totalSynced = 0;

    try {
      // Get all content-related integrations
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('service_type', 'content')
        .eq('status', 'active');

      if (error) throw error;

      if (!integrations || integrations.length === 0) {
        return { success: true, synced: 0, errors: ['No active content integrations found'] };
      }

      // Sync each integration
      for (const integration of integrations) {
        try {
          const synced = await this.syncIntegration(integration);
          totalSynced += synced;
        } catch (error: any) {
          const errorMsg = `Failed to sync ${integration.service_name}: ${error.message}`;
          Logger.error(errorMsg, error);
          errors.push(errorMsg);
        }
      }

      // Update last sync time
      await supabase
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('service_type', 'content');

      return {
        success: errors.length === 0,
        synced: totalSynced,
        errors,
      };
    } catch (error: any) {
      Logger.error('Content sync failed', error);
      return {
        success: false,
        synced: totalSynced,
        errors: [error.message],
      };
    }
  }

  /**
   * Sync a single integration
   */
  private static async syncIntegration(integration: any): Promise<number> {
    const credentials = JSON.parse(Encryption.decrypt(integration.credentials));
    const accessToken = credentials.access_token;

    switch (integration.service_name) {
      case 'meta_insights':
        return await this.syncMetaInsights(integration, accessToken);
      case 'tiktok_analytics':
        return await this.syncTikTokAnalytics(integration, accessToken);
      default:
        throw new Error(`Unknown service: ${integration.service_name}`);
    }
  }

  /**
   * Sync Meta Insights data
   */
  private static async syncMetaInsights(integration: any, accessToken: string): Promise<number> {
    const client = new MetaInsightsClient(accessToken);
    const supabase = await createClient();
    const config = integration.config || {};
    
    let syncedCount = 0;

    try {
      // Sync Facebook posts if page_id is configured
      if (config.facebook_page_id) {
        const posts = await client.getPagePosts(
          config.facebook_page_id,
          25,
          this.getLastSyncDate(integration.last_sync_at)
        );
        
        for (const post of posts) {
          await this.saveContentAsset(integration.user_id, post, 'meta');
          syncedCount++;
        }
      }

      // Sync Instagram media if instagram_account_id is configured
      if (config.instagram_account_id) {
        const media = await client.getInstagramMedia(
          config.instagram_account_id,
          25,
          this.getLastSyncDate(integration.last_sync_at)
        );
        
        for (const item of media) {
          await this.saveContentAsset(integration.user_id, item, 'instagram');
          syncedCount++;
        }
      }

      Logger.info('Meta Insights sync completed', { syncedCount });
      return syncedCount;
    } catch (error: any) {
      Logger.error('Meta Insights sync error', error);
      throw error;
    }
  }

  /**
   * Sync TikTok Analytics data
   */
  private static async syncTikTokAnalytics(integration: any, accessToken: string): Promise<number> {
    const client = new TikTokAnalyticsClient(accessToken);
    let syncedCount = 0;

    try {
      // Get user videos
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore && syncedCount < 100) { // Limit to 100 videos per sync
        const result = await client.getUserVideos(20, cursor);
        
        for (const video of result.videos) {
          await this.saveContentAsset(integration.user_id, video, 'tiktok');
          syncedCount++;
        }

        cursor = result.cursor;
        hasMore = result.hasMore;
      }

      Logger.info('TikTok Analytics sync completed', { syncedCount });
      return syncedCount;
    } catch (error: any) {
      Logger.error('TikTok Analytics sync error', error);
      throw error;
    }
  }

  /**
   * Save content asset to database
   */
  private static async saveContentAsset(
    userId: string,
    post: SocialMediaPost,
    platform: string
  ): Promise<void> {
    const supabase = await createClient();

    const asset: Partial<ContentAsset> = {
      user_id: userId,
      type: post.media_url ? 'mixed' : 'text',
      title: post.content.substring(0, 100),
      description: post.content,
      tags: this.extractHashtags(post.content),
      platform: platform as any,
      url: post.media_url || '',
      storage_path: '',
      metrics: post.metrics,
    };

    // Upsert based on platform and post_id
    const { error } = await supabase
      .from('content_assets')
      .upsert(
        {
          ...asset,
          // Use a composite key approach
          id: `${platform}_${post.post_id}`,
          created_at: post.posted_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      Logger.error('Failed to save content asset', error);
      throw error;
    }
  }

  /**
   * Extract hashtags from content
   */
  private static extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u4e00-\u9fa5]+/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Get last sync date or default to 30 days ago
   */
  private static getLastSyncDate(lastSyncAt?: string): Date {
    if (lastSyncAt) {
      return new Date(lastSyncAt);
    }
    // Default to 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }

  /**
   * Aggregate metrics across platforms
   */
  static async getAggregatedMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
    byPlatform: Record<string, any>;
  }> {
    const supabase = await createClient();

    let query = supabase
      .from('content_assets')
      .select('platform, metrics')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: assets, error } = await query;

    if (error) throw error;

    const aggregated = {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      avgEngagementRate: 0,
      byPlatform: {} as Record<string, any>,
    };

    if (!assets || assets.length === 0) {
      return aggregated;
    }

    const platformStats: Record<string, any> = {};

    assets.forEach((asset: any) => {
      const metrics = asset.metrics;
      const platform = asset.platform;

      // Aggregate totals
      aggregated.totalViews += metrics.views || 0;
      aggregated.totalLikes += metrics.likes || 0;
      aggregated.totalComments += metrics.comments || 0;
      aggregated.totalShares += metrics.shares || 0;

      // Aggregate by platform
      if (!platformStats[platform]) {
        platformStats[platform] = {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagementRates: [],
          count: 0,
        };
      }

      platformStats[platform].views += metrics.views || 0;
      platformStats[platform].likes += metrics.likes || 0;
      platformStats[platform].comments += metrics.comments || 0;
      platformStats[platform].shares += metrics.shares || 0;
      platformStats[platform].engagementRates.push(metrics.engagement_rate || 0);
      platformStats[platform].count += 1;
    });

    // Calculate averages
    const allEngagementRates = Object.values(platformStats).flatMap(
      (stats: any) => stats.engagementRates
    );
    aggregated.avgEngagementRate =
      allEngagementRates.reduce((sum, rate) => sum + rate, 0) / allEngagementRates.length;

    // Calculate platform averages
    Object.keys(platformStats).forEach((platform) => {
      const stats = platformStats[platform];
      aggregated.byPlatform[platform] = {
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        shares: stats.shares,
        avgEngagementRate:
          stats.engagementRates.reduce((sum: number, rate: number) => sum + rate, 0) /
          stats.engagementRates.length,
        postCount: stats.count,
      };
    });

    return aggregated;
  }
}
