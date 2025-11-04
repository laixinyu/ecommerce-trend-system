// 速率限制器

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  queueEnabled?: boolean;
}

interface RequestRecord {
  timestamp: number;
  promise: Promise<unknown>;
}

/**
 * 速率限制器类
 * 用于控制API调用频率，避免超过第三方服务的速率限制
 */
export class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private queues: Map<string, Array<() => void>> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * 设置特定服务的速率限制配置
   * @param key 服务标识
   * @param config 速率限制配置
   */
  setConfig(key: string, config: RateLimitConfig): void {
    this.configs.set(key, config);
  }

  /**
   * 获取配置，如果不存在则使用默认配置
   * @param key 服务标识
   * @returns 速率限制配置
   */
  private getConfig(key: string): RateLimitConfig {
    return (
      this.configs.get(key) || {
        maxRequests: 10,
        windowMs: 60000, // 1分钟
        queueEnabled: true,
      }
    );
  }

  /**
   * 清理过期的请求记录
   * @param key 服务标识
   * @param config 速率限制配置
   */
  private cleanupExpiredRequests(key: string, config: RateLimitConfig): void {
    const records = this.requests.get(key) || [];
    const now = Date.now();
    const validRecords = records.filter(
      (record) => now - record.timestamp < config.windowMs
    );
    this.requests.set(key, validRecords);
  }

  /**
   * 检查是否可以执行请求
   * @param key 服务标识
   * @returns 是否可以执行
   */
  private canExecute(key: string): boolean {
    const config = this.getConfig(key);
    this.cleanupExpiredRequests(key, config);

    const records = this.requests.get(key) || [];
    return records.length < config.maxRequests;
  }

  /**
   * 等待直到可以执行请求
   * @param key 服务标识
   * @returns Promise
   */
  private async waitForSlot(key: string): Promise<void> {
    const config = this.getConfig(key);

    while (!this.canExecute(key)) {
      // 计算需要等待的时间
      const records = this.requests.get(key) || [];
      if (records.length > 0) {
        const oldestRecord = records[0];
        const waitTime = config.windowMs - (Date.now() - oldestRecord.timestamp);
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime + 100));
        }
      }
      this.cleanupExpiredRequests(key, config);
    }
  }

  /**
   * 使用速率限制执行函数
   * @param key 服务标识（如 'meta_ads', 'google_ads'）
   * @param fn 要执行的异步函数
   * @returns 函数执行结果
   */
  async throttle<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const config = this.getConfig(key);

    // 如果启用队列，等待可用槽位
    if (config.queueEnabled) {
      await this.waitForSlot(key);
    } else {
      // 否则检查是否可以执行
      if (!this.canExecute(key)) {
        throw new Error(`Rate limit exceeded for ${key}`);
      }
    }

    // 记录请求
    const records = this.requests.get(key) || [];
    const promise = fn();
    records.push({
      timestamp: Date.now(),
      promise,
    });
    this.requests.set(key, records);

    try {
      return await promise;
    } finally {
      // 请求完成后，清理记录
      this.cleanupExpiredRequests(key, config);
    }
  }

  /**
   * 批量执行请求（自动分批）
   * @param key 服务标识
   * @param items 要处理的项目数组
   * @param fn 处理单个项目的函数
   * @returns 所有结果的数组
   */
  async throttleBatch<T, R>(
    key: string,
    items: T[],
    fn: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];

    for (const item of items) {
      const result = await this.throttle(key, () => fn(item));
      results.push(result);
    }

    return results;
  }

  /**
   * 获取当前速率限制状态
   * @param key 服务标识
   * @returns 状态信息
   */
  getStatus(key: string): {
    currentRequests: number;
    maxRequests: number;
    windowMs: number;
    availableSlots: number;
  } {
    const config = this.getConfig(key);
    this.cleanupExpiredRequests(key, config);

    const records = this.requests.get(key) || [];
    return {
      currentRequests: records.length,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      availableSlots: config.maxRequests - records.length,
    };
  }

  /**
   * 重置特定服务的速率限制
   * @param key 服务标识
   */
  reset(key: string): void {
    this.requests.delete(key);
    this.queues.delete(key);
  }

  /**
   * 重置所有速率限制
   */
  resetAll(): void {
    this.requests.clear();
    this.queues.clear();
  }
}

// 导出单例实例
export const rateLimiter = new RateLimiter();

// 预配置常见服务的速率限制
rateLimiter.setConfig('meta_ads', {
  maxRequests: 200,
  windowMs: 3600000, // 1小时
  queueEnabled: true,
});

rateLimiter.setConfig('google_ads', {
  maxRequests: 15000,
  windowMs: 86400000, // 24小时
  queueEnabled: true,
});

rateLimiter.setConfig('hubspot', {
  maxRequests: 100,
  windowMs: 10000, // 10秒
  queueEnabled: true,
});

rateLimiter.setConfig('shopify', {
  maxRequests: 40,
  windowMs: 1000, // 1秒
  queueEnabled: true,
});
