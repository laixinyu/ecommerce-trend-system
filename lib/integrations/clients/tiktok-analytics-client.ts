import axios, { AxiosInstance } from 'axios';
import { ContentMetrics, SocialMediaPost } from '@/types/content';
import { retryWithBackoff } from '@/lib/utils/retry';
import { Logger } from '@/lib/utils/logger';

export class TikTokAnalyticsClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://open.tiktokapis.com/v2',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get user info
   */
  async getUserInfo(): Promise<any> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const response = await this.client.get('/user/info/', {
          params: {
            fields: 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count',
          },
        });
        
        Logger.apiCall('tiktok_analytics', 'getUserInfo', Date.now() - start);
        return response.data.data.user;
      } catch (error: any) {
        Logger.error('TikTok Analytics API error', error);
        throw error;
      }
    });
  }

  /**
   * Get user videos
   */
  async getUserVideos(
    limit: number = 20,
    cursor?: string
  ): Promise<{ videos: SocialMediaPost[]; cursor?: string; hasMore: boolean }> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const params: any = {
          fields: 'id,title,video_description,duration,cover_image_url,share_url,create_time,view_count,like_count,comment_count,share_count',
          max_count: limit,
        };

        if (cursor) {
          params.cursor = cursor;
        }

        const response = await this.client.post('/video/list/', params);
        
        Logger.apiCall('tiktok_analytics', 'getUserVideos', Date.now() - start);
        
        const data = response.data.data;
        const videos = (data.videos || []).map((video: any) => this.transformVideo(video));

        return {
          videos,
          cursor: data.cursor,
          hasMore: data.has_more || false,
        };
      } catch (error: any) {
        Logger.error('TikTok Analytics API error', error);
        throw error;
      }
    });
  }

  /**
   * Get video insights
   */
  async getVideoInsights(videoId: string): Promise<ContentMetrics> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        // Note: TikTok API may require business account for detailed insights
        const response = await this.client.get(`/video/query/`, {
          params: {
            fields: 'id,view_count,like_count,comment_count,share_count,play_count,reach',
            filters: JSON.stringify({
              video_ids: [videoId],
            }),
          },
        });
        
        Logger.apiCall('tiktok_analytics', 'getVideoInsights', Date.now() - start);
        
        const video = response.data.data.videos?.[0];
        return this.extractMetrics(video);
      } catch (error: any) {
        Logger.error('TikTok Analytics API error', error, { videoId });
        throw error;
      }
    });
  }

  /**
   * Get account analytics (requires business account)
   */
  async getAccountAnalytics(
    startDate: Date,
    endDate: Date,
    metrics: string[] = ['video_views', 'profile_views', 'likes', 'comments', 'shares', 'followers']
  ): Promise<any> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const response = await this.client.get('/research/user/stats/', {
          params: {
            start_date: this.formatDate(startDate),
            end_date: this.formatDate(endDate),
            fields: metrics.join(','),
          },
        });
        
        Logger.apiCall('tiktok_analytics', 'getAccountAnalytics', Date.now() - start);
        return response.data.data;
      } catch (error: any) {
        Logger.error('TikTok Analytics API error', error);
        throw error;
      }
    });
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 10): Promise<string[]> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const response = await this.client.get('/research/hashtag/trending/', {
          params: {
            count: limit,
          },
        });
        
        Logger.apiCall('tiktok_analytics', 'getTrendingHashtags', Date.now() - start);
        return response.data.data.hashtags || [];
      } catch (error: any) {
        Logger.error('TikTok Analytics API error', error);
        // Return empty array if endpoint not available
        return [];
      }
    });
  }

  /**
   * Search videos by hashtag
   */
  async searchVideosByHashtag(
    hashtag: string,
    limit: number = 20,
    cursor?: string
  ): Promise<{ videos: any[]; cursor?: string; hasMore: boolean }> {
    return retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        const response = await this.client.post('/research/video/query/', {
          query: {
            and: [
              {
                field_name: 'hashtag_name',
                field_values: [hashtag],
                operation: 'IN',
              },
            ],
          },
          max_count: limit,
          cursor: cursor || 0,
        });
        
        Logger.apiCall('tiktok_analytics', 'searchVideosByHashtag', Date.now() - start);
        
        const data = response.data.data;
        return {
          videos: data.videos || [],
          cursor: data.cursor,
          hasMore: data.has_more || false,
        };
      } catch (error: any) {
        Logger.error('TikTok Analytics API error', error, { hashtag });
        throw error;
      }
    });
  }

  /**
   * Transform TikTok video to SocialMediaPost
   */
  private transformVideo(video: any): SocialMediaPost {
    const metrics = this.extractMetrics(video);

    return {
      id: video.id,
      platform: 'tiktok',
      post_id: video.id,
      content: video.video_description || video.title || '',
      media_url: video.cover_image_url,
      metrics,
      posted_at: new Date(video.create_time * 1000).toISOString(),
    };
  }

  /**
   * Extract metrics from video data
   */
  private extractMetrics(video: any): ContentMetrics {
    const views = video.view_count || video.play_count || 0;
    const likes = video.like_count || 0;
    const comments = video.comment_count || 0;
    const shares = video.share_count || 0;
    const reach = video.reach || views;

    const totalEngagement = likes + comments + shares;
    const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

    return {
      views,
      likes,
      comments,
      shares,
      engagement_rate: engagementRate,
      reach,
      date: new Date().toISOString(),
    };
  }

  /**
   * Format date for TikTok API (YYYYMMDD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const userInfo = await this.getUserInfo();
      return !!userInfo.open_id;
    } catch (error) {
      Logger.error('TikTok Analytics connection test failed', error as Error);
      return false;
    }
  }
}
