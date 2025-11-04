// 重试机制工具

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * 使用指数退避策略重试异步函数
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 函数执行结果
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    exponentialBackoff = true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 调用重试回调
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      // 计算延迟时间
      let delay = exponentialBackoff
        ? baseDelay * Math.pow(2, attempt)
        : baseDelay;

      // 添加随机抖动（jitter）避免雷鸣群效应
      delay = delay * (0.5 + Math.random() * 0.5);

      // 限制最大延迟
      delay = Math.min(delay, maxDelay);

      // 等待后重试
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * 判断错误是否可重试
 * @param error 错误对象
 * @returns 是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  // 类型守卫
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const err = error as Record<string, unknown>;

  // 网络错误
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    return true;
  }

  // HTTP状态码
  if (err.response && typeof err.response === 'object') {
    const response = err.response as Record<string, unknown>;
    const status = response.status;
    if (typeof status === 'number') {
      // 5xx服务器错误和429速率限制可重试
      return status >= 500 || status === 429 || status === 408;
    }
  }

  return false;
}

/**
 * 带条件判断的重试
 * @param fn 要执行的异步函数
 * @param shouldRetry 判断是否应该重试的函数
 * @param options 重试选项
 * @returns 函数执行结果
 */
export async function retryIf<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 检查是否应该重试
      if (!shouldRetry(lastError) || attempt === maxRetries) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * 睡眠函数
 * @param ms 毫秒数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 批量重试（用于批量操作）
 * @param items 要处理的项目数组
 * @param fn 处理单个项目的函数
 * @param options 重试选项
 * @returns 成功和失败的结果
 */
export async function retryBatch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: RetryOptions = {}
): Promise<{
  succeeded: Array<{ item: T; result: R }>;
  failed: Array<{ item: T; error: Error }>;
}> {
  const succeeded: Array<{ item: T; result: R }> = [];
  const failed: Array<{ item: T; error: Error }> = [];

  await Promise.all(
    items.map(async (item) => {
      try {
        const result = await retryWithBackoff(() => fn(item), options);
        succeeded.push({ item, result });
      } catch (error) {
        failed.push({
          item,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    })
  );

  return { succeeded, failed };
}
