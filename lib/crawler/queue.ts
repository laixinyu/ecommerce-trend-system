// 数据采集任务队列管理

export interface CrawlTask {
  id: string;
  platform: 'amazon' | 'aliexpress' | 'ebay';
  category?: string;
  keywords?: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class CrawlQueue {
  private queue: CrawlTask[] = [];
  private running: Map<string, CrawlTask> = new Map();
  private maxConcurrent: number = 3;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  // 添加任务到队列
  addTask(task: Omit<CrawlTask, 'id' | 'status' | 'retryCount' | 'createdAt'>): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: CrawlTask = {
      ...task,
      id,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
    };

    this.queue.push(newTask);
    this.sortQueue();
    return id;
  }

  // 按优先级排序队列
  private sortQueue(): void {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  // 获取下一个待执行的任务
  getNextTask(): CrawlTask | null {
    if (this.running.size >= this.maxConcurrent) {
      return null;
    }

    const task = this.queue.find((t) => t.status === 'pending');
    if (!task) return null;

    task.status = 'running';
    task.startedAt = new Date();
    this.running.set(task.id, task);

    return task;
  }

  // 标记任务完成
  completeTask(taskId: string): void {
    const task = this.running.get(taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date();
      this.running.delete(taskId);
      this.removeFromQueue(taskId);
    }
  }

  // 标记任务失败
  failTask(taskId: string, error: string): void {
    const task = this.running.get(taskId);
    if (task) {
      task.error = error;
      task.retryCount++;

      if (task.retryCount < task.maxRetries) {
        // 重新加入队列
        task.status = 'pending';
        this.running.delete(taskId);
      } else {
        // 超过最大重试次数
        task.status = 'failed';
        task.completedAt = new Date();
        this.running.delete(taskId);
        this.removeFromQueue(taskId);
      }
    }
  }

  // 从队列中移除任务
  private removeFromQueue(taskId: string): void {
    this.queue = this.queue.filter((t) => t.id !== taskId);
  }

  // 获取队列状态
  getStatus() {
    return {
      pending: this.queue.filter((t) => t.status === 'pending').length,
      running: this.running.size,
      total: this.queue.length,
    };
  }

  // 获取所有任务
  getAllTasks(): CrawlTask[] {
    return [...this.queue, ...Array.from(this.running.values())];
  }

  // 清空队列
  clear(): void {
    this.queue = [];
    this.running.clear();
  }
}

// 全局队列实例
export const crawlQueue = new CrawlQueue(3);
