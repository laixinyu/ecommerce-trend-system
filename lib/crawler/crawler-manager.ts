/**
 * 爬虫管理器
 * 统一管理不同平台的爬虫
 */

import { realAmazonCrawler } from './real-amazon-crawler';
import { realAliExpressCrawler } from './real-aliexpress-crawler';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type Platform = 'amazon' | 'aliexpress';

export interface CrawlTask {
  platform: Platform;
  keyword: string;
  categoryId: string;
  maxPages?: number;
}

export interface CrawlResult {
  platform: Platform;
  keyword: string;
  productsFound: number;
  productsSaved: number;
  success: boolean;
  error?: string;
  duration: number;
}

export class CrawlerManager {
  /**
   * 执行单个爬取任务
   */
  async executeCrawlTask(task: CrawlTask): Promise<CrawlResult> {
    const startTime = Date.now();
    const { platform, keyword, categoryId, maxPages = 3 } = task;

    console.log(`Starting crawl task: ${platform} - ${keyword || 'category browse'}`);

    try {
      let productsSaved = 0;
      
      // 如果没有关键词，获取类目名称
      let categoryName: string | undefined;
      if (!keyword) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
        
        const { data: category } = await (supabase as any)
          .from('categories')
          .select('name')
          .eq('id', categoryId)
          .single();
        
        if (category) {
          categoryName = category.name;
          console.log(`Using category name for browsing: ${categoryName}`);
        }
      }

      switch (platform) {
        case 'amazon':
          productsSaved = await realAmazonCrawler.execute(keyword, categoryId, maxPages, categoryName);
          break;
        case 'aliexpress':
          productsSaved = await realAliExpressCrawler.execute(keyword, categoryId, maxPages, categoryName);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      const duration = Date.now() - startTime;

      return {
        platform,
        keyword: keyword || categoryName || 'category',
        productsFound: productsSaved,
        productsSaved,
        success: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Crawl task failed: ${platform} - ${keyword}`, error);

      return {
        platform,
        keyword,
        productsFound: 0,
        productsSaved: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  /**
   * 执行多个爬取任务（串行）
   */
  async executeCrawlTasks(tasks: CrawlTask[]): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];

    for (const task of tasks) {
      const result = await this.executeCrawlTask(task);
      results.push(result);

      // 记录爬取日志
      await this.logCrawlResult(result);

      // 任务之间延迟，避免过于频繁
      await this.delay(5000, 10000);
    }

    return results;
  }

  /**
   * 根据分类自动爬取
   */
  async crawlByCategory(categoryId: string, platforms: Platform[] = ['amazon', 'aliexpress']): Promise<CrawlResult[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // 获取分类信息
    const { data: category } = await (supabase as any)
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single();

    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    // 为每个平台创建爬取任务
    const tasks: CrawlTask[] = platforms.map(platform => ({
      platform,
      keyword: category.name,
      categoryId,
      maxPages: 2,
    }));

    return this.executeCrawlTasks(tasks);
  }

  /**
   * 记录爬取结果到数据库
   */
  private async logCrawlResult(result: CrawlResult): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    try {
      await (supabase as any).from('crawl_logs').insert({
        platform: result.platform,
        status: result.success ? 'completed' : 'failed',
        products_found: result.productsFound,
        products_saved: result.productsSaved,
        error_message: result.error,
        duration_ms: result.duration,
        metadata: {
          keyword: result.keyword,
        },
      });
    } catch (error) {
      console.error('Failed to log crawl result:', error);
    }
  }

  /**
   * 随机延迟
   */
  private async delay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 获取爬取统计
   */
  async getCrawlStats(days: number = 7): Promise<{
    totalCrawls: number;
    successfulCrawls: number;
    failedCrawls: number;
    totalProducts: number;
    byPlatform: Record<Platform, number>;
  }> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: logs } = await (supabase as any)
      .from('crawl_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (!logs) {
      return {
        totalCrawls: 0,
        successfulCrawls: 0,
        failedCrawls: 0,
        totalProducts: 0,
        byPlatform: { amazon: 0, aliexpress: 0 },
      };
    }

    const stats = {
      totalCrawls: logs.length,
      successfulCrawls: logs.filter((l: any) => l.status === 'completed').length,
      failedCrawls: logs.filter((l: any) => l.status === 'failed').length,
      totalProducts: logs.reduce((sum: number, l: any) => sum + (l.products_saved || 0), 0),
      byPlatform: {
        amazon: logs.filter((l: any) => l.platform === 'amazon').reduce((sum: number, l: any) => sum + (l.products_saved || 0), 0),
        aliexpress: logs.filter((l: unknown) => l.platform === 'aliexpress').reduce((sum: number, l: unknown) => sum + (l.products_saved || 0), 0),
      },
    };

    return stats;
  }
}

export const crawlerManager = new CrawlerManager();
