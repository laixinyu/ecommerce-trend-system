'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Order } from '@/types/supply-chain';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, platformFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (platformFilter !== 'all') params.append('platform', platformFilter);

      const res = await fetch(`/api/supply-chain/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      pending: { label: '待处理', color: 'bg-yellow-500', icon: <Clock className="h-3 w-3" /> },
      processing: { label: '处理中', color: 'bg-blue-500', icon: <Package className="h-3 w-3" /> },
      shipped: { label: '已发货', color: 'bg-purple-500', icon: <Truck className="h-3 w-3" /> },
      delivered: { label: '已送达', color: 'bg-green-500', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { label: '已取消', color: 'bg-red-500', icon: <XCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status || 'pending'];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPlatformBadge = (platform: string | null) => {
    const colors: Record<string, string> = {
      shopify: 'bg-green-600',
      woocommerce: 'bg-purple-600',
      amazon: 'bg-orange-600',
    };

    return (
      <Badge className={colors[platform || ''] || 'bg-gray-600'}>
        {platform?.toUpperCase() || 'UNKNOWN'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">订单管理</h1>
        <p className="text-gray-600 mt-2">查看和管理订单</p>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">订单状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                  <SelectItem value="shipped">已发货</SelectItem>
                  <SelectItem value="delivered">已送达</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">平台</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择平台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部平台</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchOrders}>刷新</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
          <CardDescription>共 {orders.length} 个订单</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">暂无订单数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          订单 #{order.external_order_id || order.id.slice(0, 8)}
                        </span>
                        {getPlatformBadge(order.platform)}
                      </div>
                      <p className="text-sm text-gray-600">
                        创建时间: {new Date(order.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-lg font-bold mt-2">
                        ${order.total_amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* 订单项 */}
                  {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-2">订单项:</p>
                      <div className="space-y-1">
                        {(order.items as Array<{ sku: string; product_name: string; quantity: number; unit_price: number }>).map((item, index) => (
                          <div key={index} className="text-sm flex justify-between">
                            <span>
                              {item.product_name} (SKU: {item.sku}) × {item.quantity}
                            </span>
                            <span className="font-medium">
                              ${(item.unit_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 物流信息 */}
                  {order.shipping_info && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-1">物流信息:</p>
                      <div className="text-sm text-gray-600">
                        <p>
                          追踪号:{' '}
                          {(order.shipping_info as { tracking_number?: string }).tracking_number || '-'}
                        </p>
                        <p>
                          承运商:{' '}
                          {(order.shipping_info as { carrier?: string }).carrier || '-'}
                        </p>
                        <p>
                          状态: {(order.shipping_info as { status?: string }).status || '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
