// API响应缓存工具
const cache = new Map<string, { data: any; timestamp: number }>();

const CACHE_DURATION = {
  short: 2 * 60 * 1000, // 2分钟
  medium: 5 * 60 * 1000, // 5分钟
  long: 30 * 60 * 1000, // 30分钟
};

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION.medium) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

export function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

export function getCacheDuration(type: 'short' | 'medium' | 'long'): number {
  return CACHE_DURATION[type];
}
