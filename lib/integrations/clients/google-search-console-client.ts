// Google Search Console API客户端
import axios, { AxiosInstance } from 'axios';
import { rateLimiter } from '../rate-limiter';
import { retryWithBackoff } from '@/lib/utils/retry';

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel: 'siteOwner' | 'siteFullUser' | 'siteRestrictedUser';
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
  responseAggregationType: string;
}

export interface SearchAnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'searchAppearance')[];
  dimensionFilterGroups?: Array<{
    filters: Array<{
      dimension: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'notContains';
      expression: string;
    }>;
  }>;
  rowLimit?: number;
  startRow?: number;
}

/**
 * Google Search Console API客户端
 * 用于获取网站SEO数据
 */
export class GoogleSearchConsoleClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://www.googleapis.com/webmasters/v3',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * 获取网站列表
   */
  async getSites(): Promise<SearchConsoleSite[]> {
    return rateLimiter.throttle('google_search_console', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get('/sites');
        return response.data.siteEntry || [];
      });
    });
  }

  /**
   * 查询搜索分析数据
   * @param siteUrl 网站URL
   * @param query 查询参数
   */
  async querySearchAnalytics(
    siteUrl: string,
    query: SearchAnalyticsQuery
  ): Promise<SearchAnalyticsResponse> {
    return rateLimiter.throttle('google_search_console', async () => {
      return retryWithBackoff(async () => {
        const encodedSiteUrl = encodeURIComponent(siteUrl);
        const response = await this.client.post(
          `/sites/${encodedSiteUrl}/searchAnalytics/query`,
          {
            startDate: query.startDate,
            endDate: query.endDate,
            dimensions: query.dimensions || ['query'],
            dimensionFilterGroups: query.dimensionFilterGroups,
            rowLimit: query.rowLimit || 1000,
            startRow: query.startRow || 0,
          }
        );

        return response.data;
      });
    });
  }

  /**
   * 获取热门搜索查询
   * @param siteUrl 网站URL
   * @param dateRange 日期范围
   * @param limit 返回数量
   */
  async getTopQueries(
    siteUrl: string,
    dateRange: {
      startDate: string;
      endDate: string;
    },
    limit: number = 100
  ): Promise<SearchAnalyticsRow[]> {
    const response = await this.querySearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ['query'],
      rowLimit: limit,
    });

    return response.rows || [];
  }

  /**
   * 获取热门页面
   * @param siteUrl 网站URL
   * @param dateRange 日期范围
   * @param limit 返回数量
   */
  async getTopPages(
    siteUrl: string,
    dateRange: {
      startDate: string;
      endDate: string;
    },
    limit: number = 100
  ): Promise<SearchAnalyticsRow[]> {
    const response = await this.querySearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ['page'],
      rowLimit: limit,
    });

    return response.rows || [];
  }

  /**
   * 获取按设备分类的数据
   * @param siteUrl 网站URL
   * @param dateRange 日期范围
   */
  async getDataByDevice(
    siteUrl: string,
    dateRange: {
      startDate: string;
      endDate: string;
    }
  ): Promise<SearchAnalyticsRow[]> {
    const response = await this.querySearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ['device'],
    });

    return response.rows || [];
  }

  /**
   * 获取按国家分类的数据
   * @param siteUrl 网站URL
   * @param dateRange 日期范围
   * @param limit 返回数量
   */
  async getDataByCountry(
    siteUrl: string,
    dateRange: {
      startDate: string;
      endDate: string;
    },
    limit: number = 50
  ): Promise<SearchAnalyticsRow[]> {
    const response = await this.querySearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ['country'],
      rowLimit: limit,
    });

    return response.rows || [];
  }

  /**
   * 获取特定查询词的数据
   * @param siteUrl 网站URL
   * @param query 查询词
   * @param dateRange 日期范围
   */
  async getQueryData(
    siteUrl: string,
    query: string,
    dateRange: {
      startDate: string;
      endDate: string;
    }
  ): Promise<SearchAnalyticsRow[]> {
    const response = await this.querySearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ['query'],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: 'query',
              operator: 'equals',
              expression: query,
            },
          ],
        },
      ],
    });

    return response.rows || [];
  }

  /**
   * 获取汇总数据
   * @param siteUrl 网站URL
   * @param dateRange 日期范围
   */
  async getSummaryData(
    siteUrl: string,
    dateRange: {
      startDate: string;
      endDate: string;
    }
  ): Promise<{
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
  }> {
    const response = await this.querySearchAnalytics(siteUrl, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: [],
    });

    if (!response.rows || response.rows.length === 0) {
      return {
        totalClicks: 0,
        totalImpressions: 0,
        averageCtr: 0,
        averagePosition: 0,
      };
    }

    const row = response.rows[0];
    return {
      totalClicks: row.clicks,
      totalImpressions: row.impressions,
      averageCtr: row.ctr,
      averagePosition: row.position,
    };
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getSites();
      return true;
    } catch (error) {
      console.error('Google Search Console connection test failed:', error);
      return false;
    }
  }
}

// 配置速率限制
rateLimiter.setConfig('google_search_console', {
  maxRequests: 200,
  windowMs: 60000, // 1分钟
  queueEnabled: true,
});
