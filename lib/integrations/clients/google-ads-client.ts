// Google Ads API客户端
import axios, { AxiosInstance } from 'axios';
import { rateLimiter } from '../rate-limiter';
import { retryWithBackoff } from '@/lib/utils/retry';

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  advertisingChannelType: string;
  biddingStrategyType: string;
  budget: {
    amountMicros: string;
  };
  startDate: string;
  endDate?: string;
}

export interface GoogleAdsMetrics {
  campaignId: string;
  campaignName: string;
  impressions: string;
  clicks: string;
  cost: string;
  conversions: string;
  conversionValue: string;
  ctr: string;
  averageCpc: string;
  averageCpm: string;
  date: string;
}

export interface GoogleAdsCustomer {
  id: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
}

/**
 * Google Ads API客户端
 * 使用Google Ads API v14
 */
export class GoogleAdsClient {
  private client: AxiosInstance;
  private accessToken: string;
  private customerId: string;
  private apiVersion: string = 'v14';

  constructor(accessToken: string, customerId?: string) {
    this.accessToken = accessToken;
    this.customerId = customerId || '';
    this.client = axios.create({
      baseURL: `https://googleads.googleapis.com/${this.apiVersion}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
      },
    });
  }

  /**
   * 设置客户ID
   */
  setCustomerId(customerId: string): void {
    this.customerId = customerId;
  }

  /**
   * 获取可访问的客户账户列表
   */
  async getAccessibleCustomers(): Promise<string[]> {
    return rateLimiter.throttle('google_ads', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(
          '/customers:listAccessibleCustomers'
        );
        return response.data.resourceNames.map((name: string) =>
          name.replace('customers/', '')
        );
      });
    });
  }

  /**
   * 获取客户信息
   */
  async getCustomer(customerId: string): Promise<GoogleAdsCustomer> {
    return rateLimiter.throttle('google_ads', async () => {
      return retryWithBackoff(async () => {
        const query = `
          SELECT
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone
          FROM customer
          WHERE customer.id = ${customerId}
        `;

        const response = await this.client.post(
          `/customers/${customerId}/googleAds:search`,
          { query }
        );

        const row = response.data.results[0];
        return {
          id: row.customer.id,
          descriptiveName: row.customer.descriptiveName,
          currencyCode: row.customer.currencyCode,
          timeZone: row.customer.timeZone,
        };
      });
    });
  }

  /**
   * 获取广告活动列表
   */
  async getCampaigns(params?: {
    status?: string[];
    limit?: number;
  }): Promise<GoogleAdsCampaign[]> {
    if (!this.customerId) {
      throw new Error('Customer ID is required');
    }

    return rateLimiter.throttle('google_ads', async () => {
      return retryWithBackoff(async () => {
        const statusFilter = params?.status
          ? `AND campaign.status IN (${params.status.map((s) => `'${s}'`).join(',')})`
          : '';

        const query = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.bidding_strategy_type,
            campaign_budget.amount_micros,
            campaign.start_date,
            campaign.end_date
          FROM campaign
          WHERE campaign.status != 'REMOVED'
          ${statusFilter}
          ORDER BY campaign.id
          LIMIT ${params?.limit || 100}
        `;

        const response = await this.client.post(
          `/customers/${this.customerId}/googleAds:search`,
          { query }
        );

        return response.data.results.map((row: any) => ({
          id: row.campaign.id,
          name: row.campaign.name,
          status: row.campaign.status,
          advertisingChannelType: row.campaign.advertisingChannelType,
          biddingStrategyType: row.campaign.biddingStrategyType,
          budget: {
            amountMicros: row.campaignBudget?.amountMicros || '0',
          },
          startDate: row.campaign.startDate,
          endDate: row.campaign.endDate,
        }));
      });
    });
  }

  /**
   * 获取广告活动指标数据
   */
  async getCampaignMetrics(
    campaignId: string,
    dateRange?: {
      startDate: string; // YYYY-MM-DD
      endDate: string; // YYYY-MM-DD
    }
  ): Promise<GoogleAdsMetrics> {
    if (!this.customerId) {
      throw new Error('Customer ID is required');
    }

    return rateLimiter.throttle('google_ads', async () => {
      return retryWithBackoff(async () => {
        const dateFilter = dateRange
          ? `AND segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'`
          : `AND segments.date DURING LAST_30_DAYS`;

        const query = `
          SELECT
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc,
            metrics.average_cpm,
            segments.date
          FROM campaign
          WHERE campaign.id = ${campaignId}
          ${dateFilter}
        `;

        const response = await this.client.post(
          `/customers/${this.customerId}/googleAds:search`,
          { query }
        );

        const row = response.data.results[0];
        if (!row) {
          throw new Error('No metrics data available');
        }

        return {
          campaignId: row.campaign.id,
          campaignName: row.campaign.name,
          impressions: row.metrics.impressions || '0',
          clicks: row.metrics.clicks || '0',
          cost: (parseInt(row.metrics.costMicros || '0') / 1000000).toString(),
          conversions: row.metrics.conversions || '0',
          conversionValue: row.metrics.conversionsValue || '0',
          ctr: row.metrics.ctr || '0',
          averageCpc:
            (parseInt(row.metrics.averageCpc || '0') / 1000000).toString(),
          averageCpm:
            (parseInt(row.metrics.averageCpm || '0') / 1000000).toString(),
          date: row.segments.date,
        };
      });
    });
  }

  /**
   * 获取广告活动的每日指标数据
   */
  async getCampaignDailyMetrics(
    campaignId: string,
    dateRange: {
      startDate: string;
      endDate: string;
    }
  ): Promise<GoogleAdsMetrics[]> {
    if (!this.customerId) {
      throw new Error('Customer ID is required');
    }

    return rateLimiter.throttle('google_ads', async () => {
      return retryWithBackoff(async () => {
        const query = `
          SELECT
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc,
            metrics.average_cpm,
            segments.date
          FROM campaign
          WHERE campaign.id = ${campaignId}
          AND segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
          ORDER BY segments.date
        `;

        const response = await this.client.post(
          `/customers/${this.customerId}/googleAds:search`,
          { query }
        );

        return response.data.results.map((row: any) => ({
          campaignId: row.campaign.id,
          campaignName: row.campaign.name,
          impressions: row.metrics.impressions || '0',
          clicks: row.metrics.clicks || '0',
          cost: (parseInt(row.metrics.costMicros || '0') / 1000000).toString(),
          conversions: row.metrics.conversions || '0',
          conversionValue: row.metrics.conversionsValue || '0',
          ctr: row.metrics.ctr || '0',
          averageCpc:
            (parseInt(row.metrics.averageCpc || '0') / 1000000).toString(),
          averageCpm:
            (parseInt(row.metrics.averageCpm || '0') / 1000000).toString(),
          date: row.segments.date,
        }));
      });
    });
  }

  /**
   * 批量获取多个广告活动的指标数据
   */
  async getBatchCampaignMetrics(
    campaignIds: string[],
    dateRange?: {
      startDate: string;
      endDate: string;
    }
  ): Promise<GoogleAdsMetrics[]> {
    const metrics = await Promise.all(
      campaignIds.map((id) => this.getCampaignMetrics(id, dateRange))
    );
    return metrics.filter((metric) => metric !== null);
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessibleCustomers();
      return true;
    } catch (error) {
      console.error('Google Ads connection test failed:', error);
      return false;
    }
  }
}
