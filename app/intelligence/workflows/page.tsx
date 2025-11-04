'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Play, Pause, Trash2, Edit, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { Workflow } from '@/types/intelligence';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/intelligence/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
      const response = await fetch(`/api/intelligence/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setWorkflows(workflows.map(w => 
          w.id === id ? { ...w, status: newStatus as any } : w
        ));
      }
    } catch (error) {
      console.error('Error toggling workflow status:', error);
    }
  };

  const handleExecute = async (id: string) => {
    setExecuting(id);

    try {
      const response = await fetch(`/api/intelligence/workflows/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: {} }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`工作流执行${data.execution.status === 'completed' ? '成功' : '失败'}`);
        fetchWorkflows(); // Refresh to update last_run_at
      } else {
        const error = await response.json();
        alert(`执行失败: ${error.error}`);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('执行失败');
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个工作流吗?')) return;

    try {
      const response = await fetch(`/api/intelligence/workflows/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkflows(workflows.filter(w => w.id !== id));
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const getTriggerLabel = (workflow: Workflow) => {
    switch (workflow.trigger.type) {
      case 'schedule':
        return '定时触发';
      case 'event':
        return '事件触发';
      case 'manual':
        return '手动触发';
      case 'webhook':
        return 'Webhook触发';
      default:
        return '未知';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '从未';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">自动化工作流</h1>
          <p className="text-gray-600 mt-2">
            创建和管理自动化任务流程
          </p>
        </div>
        <Link href="/intelligence/workflows/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            创建工作流
          </Button>
        </Link>
      </div>

      {workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">还没有工作流</h3>
          <p className="text-gray-600 mb-4">
            创建您的第一个自动化工作流
          </p>
          <Link href="/intelligence/workflows/new">
            <Button>创建工作流</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{workflow.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        workflow.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : workflow.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {workflow.status === 'active' ? '运行中' : 
                       workflow.status === 'paused' ? '已暂停' : '草稿'}
                    </span>
                  </div>

                  {workflow.description && (
                    <p className="text-gray-600 mb-3">{workflow.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getTriggerLabel(workflow)}
                    </div>
                    <div>
                      {workflow.steps.length} 个步骤
                    </div>
                    <div>
                      最后运行: {formatDate(workflow.last_run_at)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleExecute(workflow.id)}
                    disabled={executing === workflow.id}
                  >
                    <Play className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggleStatus(workflow.id, workflow.status)}
                  >
                    {workflow.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Link href={`/intelligence/workflows/${workflow.id}/edit`}>
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(workflow.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
