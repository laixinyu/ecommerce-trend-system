'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, Star, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Dashboard, DashboardTemplate } from '@/types/intelligence';

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'templates'>('my');

  useEffect(() => {
    fetchDashboards();
    fetchTemplates();
  }, []);

  const fetchDashboards = async () => {
    try {
      const response = await fetch('/api/intelligence/dashboards');
      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards || []);
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/intelligence/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个仪表板吗?')) return;

    try {
      const response = await fetch(`/api/intelligence/dashboards/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDashboards(dashboards.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/intelligence/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/intelligence/dashboards/${data.dashboard.id}`;
      }
    } catch (error) {
      console.error('Error creating dashboard from template:', error);
    }
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
          <h1 className="text-3xl font-bold">数据仪表板</h1>
          <p className="text-gray-600 mt-2">
            创建和管理自定义数据仪表板
          </p>
        </div>
        <Link href="/intelligence/dashboards/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            创建仪表板
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 ${
            activeTab === 'my'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('my')}
        >
          我的仪表板 ({dashboards.length})
        </button>
        <button
          className={`pb-2 px-4 ${
            activeTab === 'templates'
              ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
              : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('templates')}
        >
          模板库 ({templates.length})
        </button>
      </div>

      {/* My Dashboards */}
      {activeTab === 'my' && (
        <div>
          {dashboards.length === 0 ? (
            <Card className="p-12 text-center">
              <LayoutDashboard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">还没有仪表板</h3>
              <p className="text-gray-600 mb-4">
                创建您的第一个仪表板或从模板开始
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/intelligence/dashboards/new">
                  <Button>创建仪表板</Button>
                </Link>
                <Button variant="outline" onClick={() => setActiveTab('templates')}>
                  浏览模板
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <Card key={dashboard.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">{dashboard.name}</h3>
                    </div>
                    {dashboard.is_default && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  
                  {dashboard.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {dashboard.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    {dashboard.widgets.length} 个组件
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/intelligence/dashboards/${dashboard.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        查看
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(dashboard.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">{template.name}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>

              <div className="text-xs text-gray-500 mb-4">
                {template.widgets.length} 个组件 · {template.category}
              </div>

              <Button
                className="w-full"
                onClick={() => handleCreateFromTemplate(template.id)}
              >
                使用模板
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
