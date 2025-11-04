'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, AlertTriangle, Truck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface InventoryMetrics {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  average_turnover_rate: number;
}

interface OrderMetrics {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
}

export default function SupplyChainPage() {
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics | null>(null);
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // 获取库存指标
      const inventoryRes = await fetch('/api/supply-chain/inventory/metrics');
      if (inventoryRes.ok) {
        const data = await inventoryRes.json();
        setInventoryMetrics(data.metrics);
      }

      // 获取订单统计
      const ordersRes = await fetch('/api/supply-chain/orders');
      if (ordersRes.ok) {
        const data = await inventoryRes.json();
        const orders = data.orders || [];
        
        const metrics: OrderMetrics = {
          total_orders: orders.length,
          pending_orders: orders.filter((o: { status: string }) => o.status === 'pending').length,
          processing_orders: orders.filter((o: { status: string }) => o.status === 'processing').length,
          shipped_orders: orders.filter((o: { status: string }) => o.status === 'shipped').length,
          delivered_orders: orders.filter((o: { status: string }) => o.status === 'delivered').length,
        };
        setOrderMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/supply-chain/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_type: 'all' }),
      });

      if (res.ok) {
        await fetchMetrics();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">供应链管理</h1>
          <p className="text-gray-600 mt-2">管理库存、订单和物流</p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? '同步中...' : '同步数据'}
        </Button>
      </div>

      {/* 库存概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总库存项</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics?.total_items || 0}</div>
            <p className="text-xs text-muted-foreground">
              总价值: ${inventoryMetrics?.total_value.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">低库存预警</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inventoryMetrics?.low_stock_items || 0}
            </div>
            <p className="text-xs text-muted-foreground">需要补货</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">缺货商品</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventoryMetrics?.out_of_stock_items || 0}
            </div>
            <p className="text-xs text-muted-foreground">立即处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">库存周转率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryMetrics?.average_turnover_rate.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">次/年</p>
          </CardContent>
        </Card>
      </div>

      {/* 订单概览 */}
      <Card>
        <CardHeader>
          <CardTitle>订单概览</CardTitle>
          <CardDescription>最近订单状态统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{orderMetrics?.total_orders || 0}</div>
              <p className="text-sm text-gray-600">总订单</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {orderMetrics?.pending_orders || 0}
              </div>
              <p className="text-sm text-gray-600">待处理</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {orderMetrics?.processing_orders || 0}
              </div>
              <p className="text-sm text-gray-600">处理中</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {orderMetrics?.shipped_orders || 0}
              </div>
              <p className="text-sm text-gray-600">已发货</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {orderMetrics?.delivered_orders || 0}
              </div>
              <p className="text-sm text-gray-600">已送达</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/supply-chain/inventory">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                库存管理
              </CardTitle>
              <CardDescription>查看和管理库存项目</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/supply-chain/orders">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                订单管理
              </CardTitle>
              <CardDescription>查看和追踪订单</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/supply-chain/tracking">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                物流追踪
              </CardTitle>
              <CardDescription>追踪物流状态</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
