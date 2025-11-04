/**
 * 爬虫错误处理器
 * 统一处理和记录爬虫错误
 */

export enum CrawlerErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  BLOCKED_ERROR = 'BLOCKED_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface CrawlerError {
  type: CrawlerErrorType;
  message: string;
  url?: string;
  timestamp: Date;
  retryable: boolean;
  details?: any;
}

export class CrawlerErrorHandler {
  private errors: CrawlerError[] = [];
  private maxErrors = 100;

  /**
   * 处理错误
   */
  handleError(error: any, url?: string): CrawlerError {
    const crawlerError = this.classifyError(error, url);
    this.recordError(crawlerError);
    this.logError(crawlerError);
    return crawlerError;
  }

  /**
   * 分类错误
   */
  private classifyError(error: any, url?: string): CrawlerError {
    const message = error.message || String(error);
    let type = CrawlerErrorType.UNKNOWN_ERROR;
    let retryable = true;

    // 网络错误
    if (
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('ETIMEDOUT') ||
      message.includes('net::ERR')
    ) {
      type = CrawlerErrorType.NETWORK_ERROR;
      retryable = true;
    }
    // 超时错误
    else if (
      message.includes('timeout') ||
      message.includes('Timeout')
    ) {
      type = CrawlerErrorType.TIMEOUT_ERROR;
      retryable = true;
    }
    // 解析错误
    else if (
      message.includes('parse') ||
      message.includes('selector') ||
      message.includes('undefined')
    ) {
      type = CrawlerErrorType.PARSE_ERROR;
      retryable = false;
    }
    // 速率限制
    else if (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      type = CrawlerErrorType.RATE_LIMIT_ERROR;
      retryable = true;
    }
    // 被封禁
    else if (
      message.includes('403') ||
      message.includes('blocked') ||
      message.includes('captcha') ||
      message.includes('Access Denied')
    ) {
      type = CrawlerErrorType.BLOCKED_ERROR;
      retryable = false;
    }

    return {
      type,
      message,
      url,
      timestamp: new Date(),
      retryable,
      details: error,
    };
  }

  /**
   * 记录错误
   */
  private recordError(error: CrawlerError): void {
    this.errors.push(error);
    
    // 限制错误记录数量
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * 记录日志
   */
  private logError(error: CrawlerError): void {
    const emoji = this.getErrorEmoji(error.type);
    console.error(
      `${emoji} [${error.type}] ${error.message}`,
      error.url ? `\nURL: ${error.url}` : '',
      error.retryable ? '\n(Retryable)' : '\n(Not retryable)'
    );
  }

  /**
   * 获取错误表情符号
   */
  private getErrorEmoji(type: CrawlerErrorType): string {
    const emojiMap: Record<CrawlerErrorType, string> = {
      [CrawlerErrorType.NETWORK_ERROR]: '🌐',
      [CrawlerErrorType.TIMEOUT_ERROR]: '⏱️',
      [CrawlerErrorType.PARSE_ERROR]: '🔍',
      [CrawlerErrorType.RATE_LIMIT_ERROR]: '🚦',
      [CrawlerErrorType.BLOCKED_ERROR]: '🚫',
      [CrawlerErrorType.UNKNOWN_ERROR]: '❓',
    };
    return emojiMap[type] || '❓';
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    retryable: number;
    nonRetryable: number;
  } {
    const byType: Record<string, number> = {};
    let retryable = 0;
    let nonRetryable = 0;

    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      if (error.retryable) {
        retryable++;
      } else {
        nonRetryable++;
      }
    });

    return {
      total: this.errors.length,
      byType,
      retryable,
      nonRetryable,
    };
  }

  /**
   * 获取最近的错误
   */
  getRecentErrors(count: number = 10): CrawlerError[] {
    return this.errors.slice(-count);
  }

  /**
   * 清除错误记录
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(error: CrawlerError, attemptCount: number, maxAttempts: number): boolean {
    if (attemptCount >= maxAttempts) {
      return false;
    }

    return error.retryable;
  }

  /**
   * 计算重试延迟（指数退避）
   */
  getRetryDelay(attemptCount: number, baseDelay: number = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attemptCount), 30000);
  }
}

export const errorHandler = new CrawlerErrorHandler();
