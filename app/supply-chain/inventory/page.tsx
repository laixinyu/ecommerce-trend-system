'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Search, RefreshCw } from 'lucide-react';
import type { InventoryItem, InventoryAlert } from '@/types/supply-chain';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
  }, [showLowStock]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showLowStock) params.append('low_stock', 'true');
      if (searchTerm) params.append('sku', searchTerm);

      const res = await fetch(`/api/supply-chain/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/supply-chain/inventory/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const handleUpdateReorderPoints = async () => {
    try {
      setUpdating(true);
      const res = await fetch('/api/supply-chain/inventory/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_time_days: 14 }),
      });

      if (res.ok) {
        await fetchInventory();
      }
    } catch (error) {
      console.error('Failed to update reorder points:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const availableStock = item.quantity_on_hand + item.quantity_in_transit;
    const reorderPoint = item.reorder_point || 0;

    if (availableStock === 0) {
      return { label: '缺货', color: 'bg-red-500' };
    } else if (availableStock <= reorderPoint * 0.5) {
      return { label: '严重不足', color: 'bg-orange-500' };
    } else if (availableStock <= reorderPoint) {
      return { label: '需补货', color: 'bg-yellow-500' };
    }
    return { label: '正常', color: 'bg-green-500' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">库存管理</h1>
          <p className="text-gray-600 mt-2">查看和管理库存项目</p>
        </div>
        <Button onClick={handleUpdateReorderPoints} disabled={updating}>
          <RefreshCw className={`mr-2 h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
          {updating ? '更新中...' : '更新再订购点'}
        </Button>
      </div>

      {/* 预警卡片 */}
      {alerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              库存预警 ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}
                >
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    SKU: {alert.item.sku} | 当前库存: {alert.item.quantity_on_hand}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchInventory()}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchInventory}>搜索</Button>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              {showLowStock ? '显示全部' : '仅显示低库存'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 库存列表 */}
      <Card>
        <CardHeader>
          <CardTitle>库存项目</CardTitle>
          <CardDescription>共 {items.length} 个库存项</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">暂无库存数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">SKU</th>
                    <th className="text-left p-3">产品名称</th>
                    <th className="text-right p-3">在手库存</th>
                    <th className="text-right p-3">在途库存</th>
                    <th className="text-right p-3">可用库存</th>
                    <th className="text-right p-3">再订购点</th>
                    <th className="text-right p-3">单位成本</th>
                    <th className="text-center p-3">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const status = getStockStatus(item);
                    const availableStock = item.quantity_on_hand + item.quantity_in_transit;

                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm">{item.sku}</td>
                        <td className="p-3">{item.product_name || '-'}</td>
                        <td className="p-3 text-right">{item.quantity_on_hand}</td>
                        <td className="p-3 text-right">{item.quantity_in_transit}</td>
                        <td className="p-3 text-right font-semibold">{availableStock}</td>
                        <td className="p-3 text-right">{item.reorder_point || '-'}</td>
                        <td className="p-3 text-right">
                          ${item.unit_cost?.toFixed(2) || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={status.color}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
