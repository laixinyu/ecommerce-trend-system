'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, MapPin, Clock } from 'lucide-react';
import type { TrackingInfo } from '@/types/supply-chain';

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!trackingNumber.trim()) {
      setError('请输入追踪号');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTrackingInfo(null);

      const res = await fetch(
        `/api/supply-chain/tracking?tracking_number=${encodeURIComponent(trackingNumber)}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '查询失败');
      }

      const data = await res.json();
      setTrackingInfo(data.tracking_info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'Not Found': 'bg-gray-500',
      'In Transit': 'bg-blue-500',
      'Expired': 'bg-red-500',
      'Pick Up': 'bg-yellow-500',
      'Undelivered': 'bg-orange-500',
      'Delivered': 'bg-green-500',
      'Alert': 'bg-red-500',
    };

    return statusColors[status] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">物流追踪</h1>
        <p className="text-gray-600 mt-2">追踪包裹物流状态</p>
      </div>

      {/* 搜索框 */}
      <Card>
        <CardHeader>
          <CardTitle>查询物流信息</CardTitle>
          <CardDescription>输入追踪号查询包裹状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="输入追踪号..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? '查询中...' : '查询'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 追踪结果 */}
      {trackingInfo && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>追踪号: {trackingInfo.tracking_number}</CardTitle>
                <CardDescription className="mt-2">
                  承运商: {trackingInfo.carrier_code}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(trackingInfo.status)}>
                {trackingInfo.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {trackingInfo.estimated_delivery && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">预计送达时间</p>
                    <p className="text-sm text-blue-700">
                      {new Date(trackingInfo.estimated_delivery).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 物流轨迹 */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                物流轨迹
              </h3>

              {trackingInfo.events && trackingInfo.events.length > 0 ? (
                <div className="space-y-4">
                  {trackingInfo.events.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        ></div>
                        {index < trackingInfo.events.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium">{event.status}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">暂无物流轨迹信息</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      {!trackingInfo && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. 在搜索框中输入您的包裹追踪号</p>
              <p>2. 点击&ldquo;查询&rdquo;按钮或按回车键</p>
              <p>3. 系统将显示包裹的最新物流状态和轨迹</p>
              <p className="mt-4 text-xs text-gray-500">
                注意: 需要先配置17track集成才能使用物流追踪功能
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
