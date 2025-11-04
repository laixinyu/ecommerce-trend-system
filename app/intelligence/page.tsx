'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, LayoutDashboard, TrendingUp, Users, Package, Brain } from 'lucide-react';
import Link from 'next/link';

interface AggregatedMetrics {
  marketing: {
    total_spend: number;
    total_revenue: number;
    roas: number;
    active_campaigns: number;
  };
  growth: {
    total_customers: number;
    active_customers: number;
    churn_rate: number;
    avg_ltv: number;
  };
  content: {
    total_assets: number;
    total_engagement: number;
    avg_engagement_rate: number;
    top_platform: string;
  };
  supply_chain: {
    total_inventory_value: number;
    low_stock_items: number;
    pending_orders: number;
    avg_fulfillment_time: number;
  };
  products: {
    total_products: number;
    trending_products: number;
    avg_rating: number;
  };
}

export default function IntelligencePage() {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/intelligence/metrics/aggregate');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('zh-CN').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
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
          <h1 className="text-3xl font-bold">智能决策中心</h1>
          <p className="text-gray-600 mt-2">
            统一数据仪表板、AI预测和自动化工作流
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/intelligence/dashboards/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              创建仪表板
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/intelligence/dashboards">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">数据仪表板</h3>
                <p className="text-sm text-gray-600">自定义数据视图</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/intelligence/workflows">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">自动化工作流</h3>
                <p className="text-sm text-gray-600">配置自动化任务</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/intelligence/predictions">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">AI预测</h3>
                <p className="text-sm text-gray-600">销量和趋势预测</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/intelligence/alerts">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold">智能预警</h3>
                <p className="text-sm text-gray-600">异常检测和通知</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Aggregated Metrics Overview */}
      {metrics && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">全局指标概览</h2>

          {/* Marketing Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              营销数字化
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">总支出</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.marketing.total_spend)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">总收入</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.marketing.total_revenue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ROAS</div>
                <div className="text-2xl font-bold">
                  {metrics.marketing.roas.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">活跃广告</div>
                <div className="text-2xl font-bold">
                  {metrics.marketing.active_campaigns}
                </div>
              </div>
            </div>
          </Card>

          {/* Growth Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              用户增长
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">总客户数</div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.growth.total_customers)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">活跃客户</div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.growth.active_customers)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">流失率</div>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.growth.churn_rate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">平均LTV</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.growth.avg_ltv)}
                </div>
              </div>
            </div>
          </Card>

          {/* Content Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5" />
              内容运营
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">内容资产</div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.content.total_assets)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">总互动数</div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.content.total_engagement)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">平均互动率</div>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.content.avg_engagement_rate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">主要平台</div>
                <div className="text-2xl font-bold">
                  {metrics.content.top_platform}
                </div>
              </div>
            </div>
          </Card>

          {/* Supply Chain Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              供应链
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">库存总值</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.supply_chain.total_inventory_value)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">低库存SKU</div>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.supply_chain.low_stock_items}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">待处理订单</div>
                <div className="text-2xl font-bold">
                  {metrics.supply_chain.pending_orders}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">平均履约时间</div>
                <div className="text-2xl font-bold">
                  {metrics.supply_chain.avg_fulfillment_time.toFixed(1)} 天
                </div>
              </div>
            </div>
          </Card>

          {/* Product Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              选品分析
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">总产品数</div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.products.total_products)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">趋势产品</div>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.products.trending_products)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">平均评分</div>
                <div className="text-2xl font-bold">
                  {metrics.products.avg_rating.toFixed(1)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
