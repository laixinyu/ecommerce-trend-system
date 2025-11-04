import axios, { AxiosInstance } from 'axios';
import { ContentMetrics, SocialMediaPost } from '@/types/content';
import { retryWithBackoff } from '@/lib/utils/retry';
import { Logger } from '@/lib/utils/logger';

export class MetaInsightsClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Get insights for a Facebook/Instagram page
   */
  async getPageInsights(
    pageId: string,
    metrics: string[] = ['page_impressions', 'page_engaged_users', 'page_post_engagements'],
    period: 'day' | 'week' | 'days_28' = 'day',
    since?: Date,
    until?: Date
  ): Promise<any> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const params: any = {
          metric: metrics.join(','),
          period,
        };

        if (since) {
          params.since = Math.floor(since.getTime() / 1000);
        }
        if (until) {
          params.until = Math.floor(until.getTime() / 1000);
        }

        const response = await this.client.get(`/${pageId}/insights`, { params });
        
        Logger.apiCall('meta_insights', 'getPageInsights', Date.now() - start);
        return response.data;
      } catch (error: any) {
        Logger.error('Meta Insights API error', error, { pageId, metrics });
        throw error;
      }
    });
  }

  /**
   * Get posts from a page
   */
  async getPagePosts(
    pageId: string,
    limit: number = 25,
    since?: Date,
    until?: Date
  ): Promise<SocialMediaPost[]> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const params: any = {
          fields: 'id,message,created_time,permalink_url,full_picture,insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total,post_clicks,post_video_views)',
          limit,
        };

        if (since) {
          params.since = Math.floor(since.getTime() / 1000);
        }
        if (until) {
          params.until = Math.floor(until.getTime() / 1000);
        }

        const response = await this.client.get(`/${pageId}/posts`, { params });
        
        Logger.apiCall('meta_insights', 'getPagePosts', Date.now() - start);
        
        // Transform to SocialMediaPost format
        return response.data.data.map((post: any) => this.transformPost(post));
      } catch (error: any) {
        Logger.error('Meta Insights API error', error, { pageId });
        throw error;
      }
    });
  }

  /**
   * Get insights for a specific post
   */
  async getPostInsights(postId: string): Promise<ContentMetrics> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const response = await this.client.get(`/${postId}/insights`, {
          params: {
            metric: 'post_impressions,post_engaged_users,post_reactions_by_type_total,post_clicks,post_video_views',
          },
        });
        
        Logger.apiCall('meta_insights', 'getPostInsights', Date.now() - start);
        
        return this.transformMetrics(response.data.data);
      } catch (error: any) {
        Logger.error('Meta Insights API error', error, { postId });
        throw error;
      }
    });
  }

  /**
   * Get Instagram insights
   */
  async getInstagramInsights(
    instagramAccountId: string,
    metrics: string[] = ['impressions', 'reach', 'profile_views', 'follower_count'],
    period: 'day' | 'week' | 'days_28' = 'day',
    since?: Date,
    until?: Date
  ): Promise<any> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const params: any = {
          metric: metrics.join(','),
          period,
        };

        if (since) {
          params.since = Math.floor(since.getTime() / 1000);
        }
        if (until) {
          params.until = Math.floor(until.getTime() / 1000);
        }

        const response = await this.client.get(`/${instagramAccountId}/insights`, { params });
        
        Logger.apiCall('meta_insights', 'getInstagramInsights', Date.now() - start);
        return response.data;
      } catch (error: any) {
        Logger.error('Meta Insights API error', error, { instagramAccountId });
        throw error;
      }
    });
  }

  /**
   * Get Instagram media (posts)
   */
  async getInstagramMedia(
    instagramAccountId: string,
    limit: number = 25,
    since?: Date,
    until?: Date
  ): Promise<SocialMediaPost[]> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const params: any = {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,insights.metric(impressions,reach,engagement,likes,comments,shares,saved)',
          limit,
        };

        if (since) {
          params.since = Math.floor(since.getTime() / 1000);
        }
        if (until) {
          params.until = Math.floor(until.getTime() / 1000);
        }

        const response = await this.client.get(`/${instagramAccountId}/media`, { params });
        
        Logger.apiCall('meta_insights', 'getInstagramMedia', Date.now() - start);
        
        return response.data.data.map((media: any) => this.transformInstagramMedia(media));
      } catch (error: any) {
        Logger.error('Meta Insights API error', error, { instagramAccountId });
        throw error;
      }
    });
  }

  /**
   * Transform Facebook post to SocialMediaPost
   */
  private transformPost(post: any): SocialMediaPost {
    const insights = post.insights?.data || [];
    const metrics = this.extractMetricsFromInsights(insights);

    return {
      id: post.id,
      platform: 'meta',
      post_id: post.id,
      content: post.message || '',
      media_url: post.full_picture,
      metrics,
      posted_at: post.created_time,
    };
  }

  /**
   * Transform Instagram media to SocialMediaPost
   */
  private transformInstagramMedia(media: any): SocialMediaPost {
    const insights = media.insights?.data || [];
    const metrics = this.extractMetricsFromInsights(insights);

    return {
      id: media.id,
      platform: 'instagram',
      post_id: media.id,
      content: media.caption || '',
      media_url: media.media_url,
      metrics,
      posted_at: media.timestamp,
    };
  }

  /**
   * Extract metrics from insights data
   */
  private extractMetricsFromInsights(insights: any[]): ContentMetrics {
    const metricsMap: any = {};
    
    insights.forEach((insight: any) => {
      const value = insight.values?.[0]?.value || 0;
      metricsMap[insight.name] = value;
    });

    const impressions = metricsMap.post_impressions || metricsMap.impressions || 0;
    const reach = metricsMap.reach || impressions;
    const engagedUsers = metricsMap.post_engaged_users || metricsMap.engagement || 0;
    const likes = metricsMap.post_reactions_by_type_total?.like || metricsMap.likes || 0;
    const comments = metricsMap.comments || 0;
    const shares = metricsMap.shares || metricsMap.saved || 0;

    return {
      views: impressions,
      likes,
      comments,
      shares,
      engagement_rate: reach > 0 ? (engagedUsers / reach) * 100 : 0,
      reach,
      date: new Date().toISOString(),
    };
  }

  /**
   * Transform insights data to ContentMetrics
   */
  private transformMetrics(insights: any[]): ContentMetrics {
    return this.extractMetricsFromInsights(insights);
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/me', {
        params: { fields: 'id,name' },
      });
      return !!response.data.id;
    } catch (error) {
      Logger.error('Meta Insights connection test failed', error as Error);
      return false;
    }
  }
}
