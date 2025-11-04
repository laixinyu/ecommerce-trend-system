// Google Analytics 4 API客户端
import axios, { AxiosInstance } from 'axios';
import { rateLimiter } from '../rate-limiter';
import { retryWithBackoff } from '@/lib/utils/retry';

export interface GA4Property {
  name: string;
  property_id: string;
  display_name: string;
  create_time: string;
}

export interface GA4Event {
  name: string;
  count: number;
  event_count_per_user?: number;
}

export interface GA4UserBehavior {
  user_id?: string;
  session_id: string;
  events: GA4Event[];
  page_path: string;
  timestamp: string;
}

export interface GA4Report {
  dimension_headers: string[];
  metric_headers: string[];
  rows: GA4ReportRow[];
}

export interface GA4ReportRow {
  dimension_values: string[];
  metric_values: string[];
}

export interface UserJourney {
  user_id: string;
  sessions: {
    session_id: string;
    start_time: string;
    events: {
      event_name: string;
      timestamp: string;
      params: Record<string, any>;
    }[];
  }[];
}

/**
 * Google Analytics 4 API客户端
 * 用于获取用户行为数据和事件追踪
 */
export class GoogleAnalyticsClient {
  private client: AxiosInstance;
  private accessToken: string;
  private propertyId: string;

  constructor(accessToken: string, propertyId: string) {
    this.accessToken = accessToken;
    this.propertyId = propertyId;
    this.client = axios.create({
      baseURL: 'https://analyticsdata.googleapis.com/v1beta',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 运行报告查询
   * @param request 报告请求参数
   */
  async runReport(request: {
    dimensions?: { name: string }[];
    metrics?: { name: string }[];
    dateRanges?: { startDate: string; endDate: string }[];
    dimensionFilter?: any;
    metricFilter?: any;
    limit?: number;
  }): Promise<GA4Report> {
    return rateLimiter.throttle('google_analytics', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.post(
          `/properties/${this.propertyId}:runReport`,
          {
            dimensions: request.dimensions || [],
            metrics: request.metrics || [],
            dateRanges: request.dateRanges || [
              { startDate: '30daysAgo', endDate: 'today' },
            ],
            dimensionFilter: request.dimensionFilter,
            metricFilter: request.metricFilter,
            limit: request.limit || 10000,
          }
        );

        return {
          dimension_headers: response.data.dimensionHeaders?.map(
            (h: any) => h.name
          ) || [],
          metric_headers: response.data.metricHeaders?.map(
            (h: any) => h.name
          ) || [],
          rows: response.data.rows?.map((row: any) => ({
            dimension_values: row.dimensionValues?.map((v: any) => v.value) || [],
            metric_values: row.metricValues?.map((v: any) => v.value) || [],
          })) || [],
        };
      });
    });
  }

  /**
   * 获取热门事件
   * @param dateRange 日期范围
   */
  async getTopEvents(dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<GA4Event[]> {
    const report = await this.runReport({
      dimensions: [{ name: 'eventName' }],
      metrics: [
        { name: 'eventCount' },
        { name: 'eventCountPerUser' },
      ],
      dateRanges: dateRange ? [dateRange] : undefined,
      limit: 50,
    });

    return report.rows.map((row) => ({
      name: row.dimension_values[0],
      count: parseInt(row.metric_values[0]),
      event_count_per_user: parseFloat(row.metric_values[1]),
    }));
  }

  /**
   * 获取用户行为路径
   * @param dateRange 日期范围
   */
  async getUserBehaviorPath(dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<GA4UserBehavior[]> {
    const report = await this.runReport({
      dimensions: [
        { name: 'sessionId' },
        { name: 'eventName' },
        { name: 'pagePath' },
      ],
      metrics: [{ name: 'eventCount' }],
      dateRanges: dateRange ? [dateRange] : undefined,
      limit: 1000,
    });

    // 按session分组
    const sessionMap = new Map<string, GA4UserBehavior>();

    report.rows.forEach((row) => {
      const sessionId = row.dimension_values[0];
      const eventName = row.dimension_values[1];
      const pagePath = row.dimension_values[2];
      const eventCount = parseInt(row.metric_values[0]);

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          session_id: sessionId,
          events: [],
          page_path: pagePath,
          timestamp: new Date().toISOString(),
        });
      }

      const session = sessionMap.get(sessionId)!;
      session.events.push({
        name: eventName,
        count: eventCount,
      });
    });

    return Array.from(sessionMap.values());
  }

  /**
   * 获取转化漏斗数据
   * @param funnelSteps 漏斗步骤（事件名称）
   */
  async getConversionFunnel(funnelSteps: string[]): Promise<{
    step: string;
    users: number;
    conversion_rate: number;
  }[]> {
    const results = [];

    for (let i = 0; i < funnelSteps.length; i++) {
      const report = await this.runReport({
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'totalUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: funnelSteps[i],
            },
          },
        },
      });

      const users = report.rows[0]
        ? parseInt(report.rows[0].metric_values[0])
        : 0;

      const conversionRate =
        i > 0 && results[i - 1].users > 0
          ? users / results[i - 1].users
          : 1;

      results.push({
        step: funnelSteps[i],
        users,
        conversion_rate: conversionRate,
      });
    }

    return results;
  }

  /**
   * 获取页面浏览数据
   * @param dateRange 日期范围
   */
  async getPageViews(dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<{
    page_path: string;
    views: number;
    unique_users: number;
    avg_time_on_page: number;
  }[]> {
    const report = await this.runReport({
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'averageSessionDuration' },
      ],
      dateRanges: dateRange ? [dateRange] : undefined,
      limit: 100,
    });

    return report.rows.map((row) => ({
      page_path: row.dimension_values[0],
      views: parseInt(row.metric_values[0]),
      unique_users: parseInt(row.metric_values[1]),
      avg_time_on_page: parseFloat(row.metric_values[2]),
    }));
  }

  /**
   * 获取用户留存数据
   * @param cohortDate 队列日期
   */
  async getUserRetention(cohortDate: string): Promise<{
    day: number;
    users: number;
    retention_rate: number;
  }[]> {
    const report = await this.runReport({
      dimensions: [{ name: 'cohortNthDay' }],
      metrics: [
        { name: 'cohortActiveUsers' },
        { name: 'cohortTotalUsers' },
      ],
      dateRanges: [{ startDate: cohortDate, endDate: 'today' }],
    });

    return report.rows.map((row) => {
      const activeUsers = parseInt(row.metric_values[0]);
      const totalUsers = parseInt(row.metric_values[1]);

      return {
        day: parseInt(row.dimension_values[0]),
        users: activeUsers,
        retention_rate: totalUsers > 0 ? activeUsers / totalUsers : 0,
      };
    });
  }

  /**
   * 追踪自定义事件
   * @param eventName 事件名称
   * @param params 事件参数
   */
  async trackEvent(
    eventName: string,
    params: Record<string, any>
  ): Promise<void> {
    // GA4的事件追踪通常在客户端完成
    // 这里提供服务端追踪的接口（使用Measurement Protocol）
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      console.warn('GA4 Measurement Protocol not configured');
      return;
    }

    await axios.post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        client_id: params.client_id || 'server',
        events: [
          {
            name: eventName,
            params,
          },
        ],
      }
    );
  }

  /**
   * 获取实时活跃用户
   */
  async getRealtimeUsers(): Promise<number> {
    return rateLimiter.throttle('google_analytics', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.post(
          `/properties/${this.propertyId}:runRealtimeReport`,
          {
            metrics: [{ name: 'activeUsers' }],
          }
        );

        return response.data.rows?.[0]?.metricValues?.[0]?.value || 0;
      });
    });
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.runReport({
        metrics: [{ name: 'activeUsers' }],
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        limit: 1,
      });
      return true;
    } catch (error) {
      console.error('Google Analytics connection test failed:', error);
      return false;
    }
  }
}
