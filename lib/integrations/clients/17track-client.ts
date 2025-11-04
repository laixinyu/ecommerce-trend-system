/**
 * 17track API客户端
 * 用于追踪物流信息
 */

import { Logger } from '@/lib/utils/logger';
import { retryWithBackoff } from '@/lib/utils/retry';
import type { TrackingInfo, TrackingEvent } from '@/types/supply-chain';

interface Track17Config {
  api_key: string;
}

interface Track17Response {
  code: number;
  data: {
    accepted: Track17TrackingItem[];
    rejected: unknown[];
  };
}

interface Track17TrackingItem {
  number: string;
  track: {
    provider_name: string;
    status: number;
    substatus: number;
    events: Track17Event[];
    estimated_delivery_date?: string;
  };
}

interface Track17Event {
  time_iso: string;
  description: string;
  location: string;
  stage: string;
}

export class Track17Client {
  private config: Track17Config;
  private baseUrl = 'https://api.17track.net/track/v2.2';

  constructor(config: Track17Config) {
    this.config = config;
  }

  /**
   * 发起API请求
   */
  private async request<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await retryWithBackoff(async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.config.api_key,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`17track API error: ${res.status} - ${error}`);
      }

      return res;
    });

    return response.json();
  }

  /**
   * 注册追踪号码
   */
  async registerTracking(trackingNumbers: string[]): Promise<void> {
    try {
      Logger.info('Registering tracking numbers with 17track', {
        count: trackingNumbers.length,
      });

      const data = trackingNumbers.map((number) => ({
        number,
        carrier: 0, // 自动检测承运商
      }));

      await this.request('/register', data);

      Logger.info('Successfully registered tracking numbers');
    } catch (error) {
      Logger.error('Failed to register tracking numbers', error as Error);
      throw error;
    }
  }

  /**
   * 获取追踪信息
   */
  async getTrackingInfo(trackingNumbers: string[]): Promise<TrackingInfo[]> {
    try {
      Logger.info('Fetching tracking info from 17track', {
        count: trackingNumbers.length,
      });

      const data = trackingNumbers.map((number) => ({
        number,
      }));

      const response = await this.request<Track17Response>('/gettrackinfo', data);

      if (response.code !== 0) {
        throw new Error(`17track API returned error code: ${response.code}`);
      }

      const trackingInfoList: TrackingInfo[] = response.data.accepted.map((item) =>
        this.convertToTrackingInfo(item)
      );

      Logger.info('Successfully fetched tracking info', {
        count: trackingInfoList.length,
      });

      return trackingInfoList;
    } catch (error) {
      Logger.error('Failed to fetch tracking info', error as Error);
      throw error;
    }
  }

  /**
   * 获取单个追踪号的信息
   */
  async getSingleTracking(trackingNumber: string): Promise<TrackingInfo | null> {
    const results = await this.getTrackingInfo([trackingNumber]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 转换17track数据格式到系统格式
   */
  private convertToTrackingInfo(item: Track17TrackingItem): TrackingInfo {
    const events: TrackingEvent[] = item.track.events.map((event) => ({
      date: event.time_iso,
      status: event.stage,
      location: event.location,
      description: event.description,
    }));

    // 映射17track状态码到可读状态
    const statusMap: Record<number, string> = {
      0: 'Not Found',
      10: 'In Transit',
      20: 'Expired',
      30: 'Pick Up',
      35: 'Undelivered',
      40: 'Delivered',
      50: 'Alert',
    };

    return {
      tracking_number: item.number,
      carrier_code: item.track.provider_name,
      status: statusMap[item.track.status] || 'Unknown',
      events,
      estimated_delivery: item.track.estimated_delivery_date,
    };
  }

  /**
   * 批量更新追踪信息
   */
  async batchUpdateTracking(trackingNumbers: string[]): Promise<TrackingInfo[]> {
    try {
      // 先注册追踪号
      await this.registerTracking(trackingNumbers);

      // 等待一小段时间让17track处理
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 获取追踪信息
      return await this.getTrackingInfo(trackingNumbers);
    } catch (error) {
      Logger.error('Failed to batch update tracking', error as Error);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 使用一个测试追踪号
      await this.getTrackingInfo(['TEST123456789']);
      return true;
    } catch (error) {
      Logger.error('17track connection test failed', error as Error);
      return false;
    }
  }
}
