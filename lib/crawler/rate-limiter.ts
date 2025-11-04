/**
 * 爬虫速率限制器
 * 防止请求过于频繁
 */

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  cooldownMs: number;
}

export class RateLimiter {
  private requestTimestamps: number[] = [];
  private config: RateLimitConfig;
  private isInCooldown = false;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      maxRequestsPerMinute: config?.maxRequestsPerMinute || 10,
      maxRequestsPerHour: config?.maxRequestsPerHour || 100,
      cooldownMs: config?.cooldownMs || 60000,
    };
  }

  /**
   * 检查是否可以发起请求
   */
  async canMakeRequest(): Promise<boolean> {
    if (this.isInCooldown) {
      return false;
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // 清理过期的时间戳
    this.requestTimestamps = this.requestTimestamps.filter(
      ts => ts > oneHourAgo
    );

    // 检查每分钟限制
    const requestsInLastMinute = this.requestTimestamps.filter(
      ts => ts > oneMinuteAgo
    ).length;

    if (requestsInLastMinute >= this.config.maxRequestsPerMinute) {
      console.warn('Rate limit: Too many requests per minute');
      return false;
    }

    // 检查每小时限制
    if (this.requestTimestamps.length >= this.config.maxRequestsPerHour) {
      console.warn('Rate limit: Too many requests per hour');
      await this.enterCooldown();
      return false;
    }

    return true;
  }

  /**
   * 记录请求
   */
  recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  /**
   * 等待直到可以发起请求
   */
  async waitForSlot(): Promise<void> {
    while (!(await this.canMakeRequest())) {
      await this.delay(5000); // 等待 5 秒后重试
    }
    this.recordRequest();
  }

  /**
   * 进入冷却期
   */
  private async enterCooldown(): Promise<void> {
    this.isInCooldown = true;
    console.log(`Entering cooldown for ${this.config.cooldownMs}ms`);
    
    await this.delay(this.config.cooldownMs);
    
    this.isInCooldown = false;
    this.requestTimestamps = []; // 清空记录
    console.log('Cooldown ended');
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    requestsInLastMinute: number;
    requestsInLastHour: number;
    isInCooldown: boolean;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    return {
      requestsInLastMinute: this.requestTimestamps.filter(ts => ts > oneMinuteAgo).length,
      requestsInLastHour: this.requestTimestamps.filter(ts => ts > oneHourAgo).length,
      isInCooldown: this.isInCooldown,
    };
  }

  /**
   * 重置限制器
   */
  reset(): void {
    this.requestTimestamps = [];
    this.isInCooldown = false;
  }
}

export const rateLimiter = new RateLimiter();
