// 搜索性能优化

import { getCachedData, setCachedData } from '@/lib/cache/api-cache';

type FilterValue = string | number | boolean;
type Filters = Record<string, FilterValue>;

// 搜索结果缓存
export class SearchCache {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟

  static getCacheKey(query: string, filters: Filters): string {
    return `search:${query}:${JSON.stringify(filters)}`;
  }

  static get<T>(query: string, filters: Filters = {}): T | null {
    const key = this.getCacheKey(query, filters);
    return getCachedData(key);
  }

  static set<T>(query: string, filters: Filters, data: T): void {
    const key = this.getCacheKey(query, filters);
    setCachedData(key, data);
  }
}

// 防抖搜索
export function debounceSearch<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// 搜索查询优化
export function optimizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // 多个空格替换为单个
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 移除特殊字符，保留中文
    .slice(0, 100); // 限制长度
}

// 分词（简单实现）
export function tokenize(text: string): string[] {
  // 简单的分词：按空格和标点分割
  return text
    .toLowerCase()
    .split(/[\s,，.。!！?？;；:：]+/)
    .filter((token) => token.length > 1);
}

// 计算查询相似度（用于查询建议）
export function calculateQuerySimilarity(query1: string, query2: string): number {
  const tokens1 = new Set(tokenize(query1));
  const tokens2 = new Set(tokenize(query2));

  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  return intersection.size / union.size;
}

// 搜索性能监控
export class SearchPerformanceMonitor {
  private static metrics: Array<{
    query: string;
    duration: number;
    resultCount: number;
    timestamp: number;
  }> = [];

  static startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }

  static recordSearch(query: string, duration: number, resultCount: number): void {
    this.metrics.push({
      query,
      duration,
      resultCount,
      timestamp: Date.now(),
    });

    // 只保留最近100条记录
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  static getAverageSearchTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  static getSlowSearches(threshold: number = 1000): typeof this.metrics {
    return this.metrics.filter((m) => m.duration > threshold);
  }

  static getMetrics() {
    return {
      totalSearches: this.metrics.length,
      averageTime: this.getAverageSearchTime(),
      slowSearches: this.getSlowSearches().length,
      recentSearches: this.metrics.slice(-10),
    };
  }
}

// 搜索结果分页优化
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export function calculatePagination(config: PaginationConfig) {
  const { page, pageSize, total } = config;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    total,
    totalPages,
    offset,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// 搜索索引预热
export async function warmupSearchIndex(commonQueries: string[]): Promise<void> {
  // 预加载常见搜索查询的结果
  for (const query of commonQueries) {
    const cached = SearchCache.get(query);
    if (!cached) {
      // 这里应该调用实际的搜索函数
      console.log(`Warming up search index for: ${query}`);
    }
  }
}
