// Klaviyo CRM API客户端
import axios, { AxiosInstance } from 'axios';
import { rateLimiter } from '../rate-limiter';
import { retryWithBackoff } from '@/lib/utils/retry';

export interface KlaviyoProfile {
  id: string;
  type: 'profile';
  attributes: {
    email: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    created: string;
    updated: string;
    properties?: Record<string, any>;
  };
}

export interface KlaviyoEvent {
  id: string;
  type: 'event';
  attributes: {
    event_name: string;
    timestamp: string;
    value?: number;
    properties?: Record<string, any>;
  };
}

export interface KlaviyoMetric {
  id: string;
  type: 'metric';
  attributes: {
    name: string;
    created: string;
    updated: string;
  };
}

export interface KlaviyoProfileWithMetrics extends KlaviyoProfile {
  totalEvents: number;
  totalValue: number;
  lastEventDate?: string;
}

/**
 * Klaviyo CRM API客户端
 * 用于获取客户数据、事件和营销指标
 */
export class KlaviyoClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://a.klaviyo.com/api',
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/json',
        revision: '2024-10-15',
      },
    });
  }

  /**
   * 获取用户档案列表
   * @param params 查询参数
   */
  async getProfiles(params?: {
    page_size?: number;
    page_cursor?: string;
  }): Promise<{ profiles: KlaviyoProfile[]; next?: string }> {
    return rateLimiter.throttle('klaviyo', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get('/profiles', {
          params: {
            'page[size]': params?.page_size || 100,
            'page[cursor]': params?.page_cursor,
          },
        });

        return {
          profiles: response.data.data,
          next: response.data.links?.next,
        };
      });
    });
  }

  /**
   * 获取单个用户档案
   * @param profileId 用户档案ID
   */
  async getProfile(profileId: string): Promise<KlaviyoProfile> {
    return rateLimiter.throttle('klaviyo', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/profiles/${profileId}`);
        return response.data.data;
      });
    });
  }

  /**
   * 通过邮箱搜索用户档案
   * @param email 邮箱地址
   */
  async searchProfileByEmail(email: string): Promise<KlaviyoProfile | null> {
    return rateLimiter.throttle('klaviyo', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get('/profiles', {
          params: {
            'filter': `equals(email,"${email}")`,
          },
        });

        return response.data.data[0] || null;
      });
    });
  }

  /**
   * 获取用户的事件记录
   * @param profileId 用户档案ID
   */
  async getProfileEvents(profileId: string): Promise<KlaviyoEvent[]> {
    return rateLimiter.throttle('klaviyo', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/profiles/${profileId}/events`);
        return response.data.data || [];
      });
    });
  }

  /**
   * 获取指标列表
   */
  async getMetrics(): Promise<KlaviyoMetric[]> {
    return rateLimiter.throttle('klaviyo', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get('/metrics');
        return response.data.data;
      });
    });
  }

  /**
   * 获取特定指标的事件
   * @param metricId 指标ID
   * @param params 查询参数
   */
  async getMetricEvents(
    metricId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      page_size?: number;
    }
  ): Promise<KlaviyoEvent[]> {
    return rateLimiter.throttle('klaviyo', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/metrics/${metricId}/events`, {
          params: {
            'filter': params?.start_date
              ? `greater-or-equal(datetime,${params.start_date})`
              : undefined,
            'page[size]': params?.page_size || 100,
          },
        });
        return response.data.data;
      });
    });
  }

  /**
   * 获取用户档案及其事件统计
   * @param profileId 用户档案ID
   */
  async getProfileWithMetrics(profileId: string): Promise<KlaviyoProfileWithMetrics> {
    const profile = await this.getProfile(profileId);
    const events = await this.getProfileEvents(profileId);

    const totalValue = events.reduce((sum, event) => {
      return sum + (event.attributes.value || 0);
    }, 0);

    const lastEvent = events.sort(
      (a, b) =>
        new Date(b.attributes.timestamp).getTime() -
        new Date(a.attributes.timestamp).getTime()
    )[0];

    return {
      ...profile,
      totalEvents: events.length,
      totalValue,
      lastEventDate: lastEvent?.attributes.timestamp,
    };
  }

  /**
   * 批量获取所有用户档案（处理分页）
   * @param maxProfiles 最大获取数量
   */
  async getAllProfiles(maxProfiles: number = 1000): Promise<KlaviyoProfile[]> {
    const allProfiles: KlaviyoProfile[] = [];
    let cursor: string | undefined;

    while (allProfiles.length < maxProfiles) {
      const result = await this.getProfiles({
        page_size: 100,
        page_cursor: cursor,
      });

      allProfiles.push(...result.profiles);

      if (!result.next) {
        break;
      }

      // 从next URL中提取cursor
      const url = new URL(result.next);
      cursor = url.searchParams.get('page[cursor]') || undefined;
    }

    return allProfiles.slice(0, maxProfiles);
  }

  /**
   * 获取订单完成事件
   * @param startDate 开始日期 (ISO 8601)
   * @param endDate 结束日期 (ISO 8601)
   */
  async getOrderEvents(startDate?: string, endDate?: string): Promise<KlaviyoEvent[]> {
    return rateLimiter.throttle('klaviyo', async () => {
      return retryWithBackoff(async () => {
        // 首先获取"Placed Order"指标
        const metrics = await this.getMetrics();
        const orderMetric = metrics.find(
          (m) =>
            m.attributes.name === 'Placed Order' ||
            m.attributes.name === 'Ordered Product'
        );

        if (!orderMetric) {
          return [];
        }

        return await this.getMetricEvents(orderMetric.id, {
          start_date: startDate,
          end_date: endDate,
        });
      });
    });
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/profiles', {
        params: { 'page[size]': 1 },
      });
      return true;
    } catch (error) {
      console.error('Klaviyo connection test failed:', error);
      return false;
    }
  }
}
