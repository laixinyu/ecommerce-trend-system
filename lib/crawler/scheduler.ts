// 数据采集调度器
import { crawlQueue, CrawlTask } from './queue';
import { createSupabaseClient } from '@/lib/supabase/client';

export interface ScheduleConfig {
  platform: 'amazon' | 'aliexpress' | 'ebay';
  categories: string[];
  interval: number; // 分钟
  enabled: boolean;
}

export interface CrawlLog {
  id?: string;
  task_id: string;
  platform: string;
  status: 'started' | 'completed' | 'failed';
  items_collected?: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export class CrawlScheduler {
  private schedules: Map<string, ScheduleConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.initializeDefaultSchedules();
  }

  // 初始化默认调度配置
  private initializeDefaultSchedules(): void {
    const defaultSchedules: ScheduleConfig[] = [
      {
        platform: 'amazon',
        categories: ['Electronics', 'Home & Kitchen', 'Sports & Outdoors'],
        interval: 60, // 每小时
        enabled: true,
      },
      {
        platform: 'aliexpress',
        categories: ['Consumer Electronics', 'Home Improvement', 'Sports & Entertainment'],
        interval: 120, // 每2小时
        enabled: true,
      },
      {
        platform: 'ebay',
        categories: ['Electronics', 'Home & Garden', 'Sporting Goods'],
        interval: 180, // 每3小时
        enabled: true,
      },
    ];

    defaultSchedules.forEach((schedule) => {
      this.schedules.set(schedule.platform, schedule);
    });
  }

  // 启动调度器
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting crawler scheduler...');

    // 为每个平台设置定时任务
    this.schedules.forEach((schedule, platform) => {
      if (schedule.enabled) {
        this.scheduleTask(platform, schedule);
      }
    });

    // 启动任务处理循环
    this.startTaskProcessor();
  }

  // 停止调度器
  stop(): void {
    this.isRunning = false;
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
    console.log('Crawler scheduler stopped');
  }

  // 调度单个平台任务
  private scheduleTask(platform: string, schedule: ScheduleConfig): void {
    // 立即执行一次
    this.createCrawlTasks(schedule);

    // 设置定时执行
    const timer = setInterval(() => {
      if (this.isRunning && schedule.enabled) {
        this.createCrawlTasks(schedule);
      }
    }, schedule.interval * 60 * 1000);

    this.timers.set(platform, timer);
    console.log(`Scheduled ${platform} crawl every ${schedule.interval} minutes`);
  }

  // 创建爬取任务
  private createCrawlTasks(schedule: ScheduleConfig): void {
    schedule.categories.forEach((category) => {
      const taskId = crawlQueue.addTask({
        platform: schedule.platform,
        category,
        priority: 'medium',
        maxRetries: 3,
      });

      console.log(`Created crawl task ${taskId} for ${schedule.platform}/${category}`);
    });
  }

  // 启动任务处理器
  private startTaskProcessor(): void {
    const processInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(processInterval);
        return;
      }

      const task = crawlQueue.getNextTask();
      if (task) {
        await this.executeTask(task);
      }
    }, 50000); // 每50秒检查一次
  }

  // 执行爬取任务
  private async executeTask(task: CrawlTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`Executing task ${task.id} for ${task.platform}/${task.category}`);
      
      // 记录任务开始
      await this.logTaskStart(task);

      // 调用爬取API
      const result = await this.crawlData(task);

      // 记录任务完成
      const duration = Date.now() - startTime;
      await this.logTaskComplete(task, result.itemsCollected, duration);

      crawlQueue.completeTask(task.id);
      console.log(`Task ${task.id} completed: ${result.itemsCollected} items collected`);

      // 发送更新通知
      await this.sendUpdateNotification(task, result.itemsCollected);

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Task ${task.id} failed:`, errorMessage);
      
      // 记录任务失败
      await this.logTaskFailed(task, errorMessage, duration);
      
      crawlQueue.failTask(task.id, errorMessage);
    }
  }

  // 爬取数据
  private async crawlData(task: CrawlTask): Promise<{ itemsCollected: number }> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/crawl/${task.platform}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true',
      },
      body: JSON.stringify({
        category: task.category,
        keywords: task.keywords,
      }),
    });

    if (!response.ok) {
      throw new Error(`Crawl API returned ${response.status}`);
    }

    const data = await response.json();
    return { itemsCollected: data.itemsCollected || 0 };
  }

  // 记录任务开始
  private async logTaskStart(task: CrawlTask): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      const log: CrawlLog = {
        task_id: task.id,
        platform: task.platform,
        status: 'started',
        started_at: new Date().toISOString(),
      };

      // @ts-expect-error - Supabase类型生成问题
      await supabase.from('crawl_logs').insert(log);
    } catch (error) {
      console.error('Failed to log task start:', error);
    }
  }

  // 记录任务完成
  private async logTaskComplete(
    task: CrawlTask,
    itemsCollected: number,
    duration: number
  ): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      // @ts-expect-error - Supabase类型生成问题
      await supabase
        .from('crawl_logs')
        .update({
          status: 'completed',
          items_collected: itemsCollected,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('task_id', task.id);
    } catch (error) {
      console.error('Failed to log task completion:', error);
    }
  }

  // 记录任务失败
  private async logTaskFailed(
    task: CrawlTask,
    errorMessage: string,
    duration: number
  ): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      // @ts-expect-error - Supabase类型生成问题
      await supabase
        .from('crawl_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('task_id', task.id);
    } catch (error) {
      console.error('Failed to log task failure:', error);
    }
  }

  // 发送数据更新通知
  private async sendUpdateNotification(task: CrawlTask, itemsCollected: number): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      
      // 获取关注该类目的用户
      const { data: users } = await supabase
        .from('user_preferences')
        .select('user_id')
        .contains('watched_categories', [task.category]);

      if (users && users.length > 0) {
        const notifications = users.map((user: { user_id: string }) => ({
          user_id: user.user_id,
          type: 'data_update',
          title: '数据更新',
          message: `${task.platform} ${task.category} 类目已更新 ${itemsCollected} 个商品`,
          data: {
            platform: task.platform,
            category: task.category,
            items_collected: itemsCollected,
          },
          created_at: new Date().toISOString(),
        }));

        // @ts-expect-error - Supabase类型生成问题
        await supabase.from('notifications').insert(notifications);
      }
    } catch (error) {
      console.error('Failed to send update notification:', error);
    }
  }

  // 更新调度配置
  updateSchedule(platform: string, config: Partial<ScheduleConfig>): void {
    const existing = this.schedules.get(platform);
    if (existing) {
      const updated = { ...existing, ...config };
      this.schedules.set(platform, updated);

      // 重新调度
      const timer = this.timers.get(platform);
      if (timer) {
        clearInterval(timer);
      }

      if (updated.enabled) {
        this.scheduleTask(platform, updated);
      }
    }
  }

  // 获取调度状态
  getStatus() {
    const scheduleStatus = Array.from(this.schedules.entries()).map(([platform, config]) => ({
      platform,
      enabled: config.enabled,
      interval: config.interval,
      categories: config.categories.length,
    }));

    return {
      isRunning: this.isRunning,
      schedules: scheduleStatus,
      queueStatus: crawlQueue.getStatus(),
    };
  }

  // 手动触发爬取
  async triggerManualCrawl(
    platform: 'amazon' | 'aliexpress' | 'ebay',
    category?: string,
    keywords?: string[]
  ): Promise<string> {
    const taskId = crawlQueue.addTask({
      platform,
      category,
      keywords,
      priority: 'high',
      maxRetries: 3,
    });

    console.log(`Manual crawl task ${taskId} created for ${platform}`);
    return taskId;
  }
}

// 全局调度器实例
export const crawlScheduler = new CrawlScheduler();
