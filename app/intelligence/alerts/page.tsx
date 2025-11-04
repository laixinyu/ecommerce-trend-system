'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react';
import { Alert } from '@/types/intelligence';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/intelligence/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const response = await fetch(`/api/intelligence/alerts/${id}/acknowledge`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`/api/intelligence/alerts/${id}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
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
          <h1 className="text-3xl font-bold">智能预警中心</h1>
          <p className="text-gray-600 mt-2">
            监控关键指标并接收异常预警
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          全部
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          活跃
        </Button>
        <Button
          variant={filter === 'acknowledged' ? 'default' : 'outline'}
          onClick={() => setFilter('acknowledged')}
        >
          已确认
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          onClick={() => setFilter('resolved')}
        >
          已解决
        </Button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">没有预警</h3>
          <p className="text-gray-600">
            {filter === 'active' ? '当前没有活跃的预警' : '没有找到预警'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-6 border-l-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getSeverityIcon(alert.severity)}
                    <h3 className="text-lg font-semibold">{alert.title}</h3>
                    <Badge variant="outline">
                      {alert.type === 'threshold' ? '阈值' :
                       alert.type === 'anomaly' ? '异常' :
                       alert.type === 'metric' ? '指标' : '预测'}
                    </Badge>
                  </div>

                  <p className="text-gray-700 mb-3">{alert.message}</p>

                  {alert.current_value !== undefined && (
                    <div className="flex gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-semibold">当前值:</span> {alert.current_value.toFixed(2)}
                      </div>
                      {alert.threshold_value !== undefined && (
                        <div>
                          <span className="font-semibold">阈值:</span> {alert.threshold_value.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

                  {alert.suggested_actions && alert.suggested_actions.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        建议操作:
                      </div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {alert.suggested_actions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    创建时间: {formatDate(alert.created_at)}
                    {alert.acknowledged_at && (
                      <span className="ml-4">
                        确认时间: {formatDate(alert.acknowledged_at)}
                      </span>
                    )}
                    {alert.resolved_at && (
                      <span className="ml-4">
                        解决时间: {formatDate(alert.resolved_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {alert.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        确认
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        解决
                      </Button>
                    </>
                  )}
                  {alert.status === 'acknowledged' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      解决
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
