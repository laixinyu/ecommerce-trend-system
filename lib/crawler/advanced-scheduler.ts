/**
 * 高级爬虫调度器
 * 支持优先级、定时任务、并发控制
 */

import { crawlerManager, type CrawlTask, type CrawlResult } from './crawler-manager';

export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

export interface ScheduledTask extends CrawlTask {
  id: string;
  priority: TaskPriority;
  scheduledAt?: Date;
  retryCount?: number;
  maxRetries?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: CrawlResult;
  error?: string;
}

export class AdvancedScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private runningTasks: Set<string> = new Set();
  private maxConcurrent = 2;
  private isRunning = false;

  /**
   * 添加任务
   */
  addTask(task: Omit<ScheduledTask, 'id' | 'status'>): string {
    const id = this.generateTaskId();
    const scheduledTask: ScheduledTask = {
      ...task,
      id,
      status: 'pending',
      retryCount: 0,
      maxRetries: task.maxRetries || 3,
    };

    this.tasks.set(id, scheduledTask);
    console.log(`Task added: ${id} (${task.platform} - ${task.keyword})`);

    // 如果调度器正在运行，触发执行
    if (this.isRunning) {
      this.processNextTask();
    }

    return id;
  }

  /**
   * 批量添加任务
   */
  addTasks(tasks: Array<Omit<ScheduledTask, 'id' | 'status'>>): string[] {
    return tasks.map(task => this.addTask(task));
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Scheduler started');
    this.processNextTask();
  }

  /**
   * 停止调度器
   */
  stop(): void {
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  /**
   * 处理下一个任务
   */
  private async processNextTask(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // 检查并发限制
    if (this.runningTasks.size >= this.maxConcurrent) {
      return;
    }

    // 获取下一个待执行的任务
    const task = this.getNextTask();
    if (!task) {
      // 没有待执行的任务，检查是否所有任务都完成
      if (this.runningTasks.size === 0) {
        console.log('All tasks completed');
      }
      return;
    }

    // 执行任务
    await this.executeTask(task);

    // 继续处理下一个任务
    this.processNextTask();
  }

  /**
   * 获取下一个待执行的任务
   */
  private getNextTask(): ScheduledTask | null {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .filter(task => {
        // 检查是否到了执行时间
        if (task.scheduledAt) {
          return new Date() >= task.scheduledAt;
        }
        return true;
      })
      .sort((a, b) => {
        // 按优先级排序
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // 相同优先级按添加时间排序
        return 0;
      });

    return pendingTasks[0] || null;
  }

  /**
   * 执行任务
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    this.runningTasks.add(task.id);
    task.status = 'running';

    console.log(`Executing task: ${task.id} (${task.platform} - ${task.keyword})`);

    try {
      const result = await crawlerManager.executeCrawlTask({
        platform: task.platform,
        keyword: task.keyword,
        categoryId: task.categoryId,
        maxPages: task.maxPages,
      });

      if (result.success) {
        task.status = 'completed';
        task.result = result;
        console.log(`Task completed: ${task.id}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`Task failed: ${task.id}`, error);
      task.error = error instanceof Error ? error.message : 'Unknown error';

      // 重试逻辑
      if (task.retryCount! < task.maxRetries!) {
        task.retryCount!++;
        task.status = 'pending';
        console.log(`Task will retry: ${task.id} (${task.retryCount}/${task.maxRetries})`);
      } else {
        task.status = 'failed';
        console.log(`Task failed permanently: ${task.id}`);
      }
    } finally {
      this.runningTasks.delete(task.id);
      
      // 继续处理下一个任务
      if (this.isRunning) {
        setTimeout(() => this.processNextTask(), 1000);
      }
    }
  }

  /**
   * 获取任务状态
   */
  getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取任务统计
   */
  getStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  }

  /**
   * 取消任务
   */
  cancelTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }

    if (task.status === 'running') {
      console.log('Cannot cancel running task');
      return false;
    }

    this.tasks.delete(id);
    console.log(`Task cancelled: ${id}`);
    return true;
  }

  /**
   * 清除已完成的任务
   */
  clearCompleted(): number {
    const completed = Array.from(this.tasks.values())
      .filter(t => t.status === 'completed');
    
    completed.forEach(task => this.tasks.delete(task.id));
    
    console.log(`Cleared ${completed.length} completed tasks`);
    return completed.length;
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 设置最大并发数
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, max);
    console.log(`Max concurrent tasks set to: ${this.maxConcurrent}`);
  }
}

export const advancedScheduler = new AdvancedScheduler();
