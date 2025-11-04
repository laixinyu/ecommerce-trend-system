// Meta Ads API客户端
import axios, { AxiosInstance } from 'axios';
import { rateLimiter } from '../rate-limiter';
import { retryWithBackoff } from '@/lib/utils/retry';

export interface MetaCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
  updated_time: string;
}

export interface MetaAdInsights {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  ctr: string;
  cpc: string;
  cpm: string;
  conversions?: string;
  conversion_value?: string;
  date_start: string;
  date_stop: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
}

/**
 * Meta Ads API客户端
 * 用于获取Facebook和Instagram广告数据
 */
export class MetaAdsClient {
  private client: AxiosInstance;
  private accessToken: string;
  private apiVersion: string = 'v18.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * 获取广告账户列表
   */
  async getAdAccounts(): Promise<MetaAdAccount[]> {
    return rateLimiter.throttle('meta_ads', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get('/me/adaccounts', {
          params: {
            fields: 'id,name,account_status,currency,timezone_name',
          },
        });
        return response.data.data;
      });
    });
  }

  /**
   * 获取广告活动列表
   * @param adAccountId 广告账户ID (格式: act_xxxxx)
   * @param params 查询参数
   */
  async getCampaigns(
    adAccountId: string,
    params?: {
      limit?: number;
      status?: string[];
    }
  ): Promise<MetaCampaign[]> {
    return rateLimiter.throttle('meta_ads', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/${adAccountId}/campaigns`, {
          params: {
            fields:
              'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time',
            limit: params?.limit || 100,
            ...(params?.status && {
              filtering: JSON.stringify([
                {
                  field: 'status',
                  operator: 'IN',
                  value: params.status,
                },
              ]),
            }),
          },
        });
        return response.data.data;
      });
    });
  }

  /**
   * 获取广告活动洞察数据
   * @param campaignId 广告活动ID
   * @param dateRange 日期范围
   */
  async getCampaignInsights(
    campaignId: string,
    dateRange?: {
      since: string; // YYYY-MM-DD
      until: string; // YYYY-MM-DD
    }
  ): Promise<MetaAdInsights> {
    return rateLimiter.throttle('meta_ads', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/${campaignId}/insights`, {
          params: {
            fields:
              'campaign_id,campaign_name,impressions,clicks,spend,reach,ctr,cpc,cpm,conversions,conversion_values',
            time_range: dateRange
              ? JSON.stringify({
                  since: dateRange.since,
                  until: dateRange.until,
                })
              : JSON.stringify({ since: '30 days ago', until: 'today' }),
          },
        });

        const data = response.data.data[0];
        if (!data) {
          throw new Error('No insights data available');
        }

        return data;
      });
    });
  }

  /**
   * 批量获取多个广告活动的洞察数据
   * @param campaignIds 广告活动ID数组
   * @param dateRange 日期范围
   */
  async getBatchCampaignInsights(
    campaignIds: string[],
    dateRange?: {
      since: string;
      until: string;
    }
  ): Promise<MetaAdInsights[]> {
    const insights = await Promise.all(
      campaignIds.map((id) => this.getCampaignInsights(id, dateRange))
    );
    return insights.filter((insight) => insight !== null);
  }

  /**
   * 获取广告账户的汇总洞察数据
   * @param adAccountId 广告账户ID
   * @param dateRange 日期范围
   */
  async getAccountInsights(
    adAccountId: string,
    dateRange?: {
      since: string;
      until: string;
    }
  ): Promise<MetaAdInsights> {
    return rateLimiter.throttle('meta_ads', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/${adAccountId}/insights`, {
          params: {
            fields:
              'impressions,clicks,spend,reach,ctr,cpc,cpm,conversions,conversion_values',
            time_range: dateRange
              ? JSON.stringify({
                  since: dateRange.since,
                  until: dateRange.until,
                })
              : JSON.stringify({ since: '30 days ago', until: 'today' }),
            level: 'account',
          },
        });

        return response.data.data[0];
      });
    });
  }

  /**
   * 获取广告活动的每日数据
   * @param campaignId 广告活动ID
   * @param dateRange 日期范围
   */
  async getCampaignDailyInsights(
    campaignId: string,
    dateRange: {
      since: string;
      until: string;
    }
  ): Promise<MetaAdInsights[]> {
    return rateLimiter.throttle('meta_ads', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/${campaignId}/insights`, {
          params: {
            fields:
              'campaign_id,campaign_name,impressions,clicks,spend,reach,ctr,cpc,cpm,conversions,conversion_values,date_start,date_stop',
            time_range: JSON.stringify({
              since: dateRange.since,
              until: dateRange.until,
            }),
            time_increment: 1, // 按天分组
          },
        });

        return response.data.data;
      });
    });
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/me', {
        params: {
          fields: 'id,name',
        },
      });
      return true;
    } catch (error) {
      console.error('Meta Ads connection test failed:', error);
      return false;
    }
  }
}
