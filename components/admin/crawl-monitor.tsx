'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SchedulerStatus {
  isRunning: boolean;
  schedules: Array<{
    platform: string;
    enabled: boolean;
    interval: number;
    categories: number;
  }>;
  queueStatus: {
    pending: number;
    running: number;
    total: number;
  };
}

interface CrawlLog {
  id: string;
  task_id: string;
  platform: string;
  status: string;
  items_collected?: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export function CrawlMonitor() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    
    // 每30秒刷新一次
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/crawl/scheduler');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch scheduler status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/crawl/logs?limit=20');
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleControl = async (action: string) => {
    try {
      const response = await fetch('/api/crawl/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (data.success) {
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to control scheduler:', error);
    }
  };

  const handleManualTrigger = async (platform: string) => {
    try {
      const response = await fetch('/api/crawl/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger', platform }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`任务已创建: ${data.taskId}`);
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to trigger crawl:', error);
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">数据采集监控</h2>
        <div className="flex gap-2">
          {status?.isRunning ? (
            <Button onClick={() => handleControl('stop')} variant="outline">
              停止调度器
            </Button>
          ) : (
            <Button onClick={() => handleControl('start')}>
              启动调度器
            </Button>
          )}
        </div>
      </div>

      {/* 调度器状态 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">调度器状态</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">运行状态</div>
            <div className="text-2xl font-bold">
              {status?.isRunning ? (
                <span className="text-green-600">运行中</span>
              ) : (
                <span className="text-gray-400">已停止</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">待处理任务</div>
            <div className="text-2xl font-bold">{status?.queueStatus.pending || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">执行中任务</div>
            <div className="text-2xl font-bold">{status?.queueStatus.running || 0}</div>
          </div>
        </div>
      </Card>

      {/* 平台调度配置 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">平台调度配置</h3>
        <div className="space-y-4">
          {status?.schedules.map((schedule) => (
            <div
              key={schedule.platform}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="font-medium capitalize">{schedule.platform}</div>
                <div className="text-sm text-gray-500">
                  每 {schedule.interval} 分钟 · {schedule.categories} 个类目
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    schedule.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {schedule.enabled ? '已启用' : '已禁用'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManualTrigger(schedule.platform)}
                >
                  手动触发
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近日志 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">最近日志</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">时间</th>
                <th className="text-left py-2">平台</th>
                <th className="text-left py-2">状态</th>
                <th className="text-right py-2">采集数量</th>
                <th className="text-right py-2">耗时</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="py-2 text-sm">
                    {new Date(log.started_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="py-2 text-sm capitalize">{log.platform}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        log.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {log.status === 'completed'
                        ? '完成'
                        : log.status === 'failed'
                        ? '失败'
                        : '进行中'}
                    </span>
                  </td>
                  <td className="py-2 text-sm text-right">
                    {log.items_collected || '-'}
                  </td>
                  <td className="py-2 text-sm text-right">
                    {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
