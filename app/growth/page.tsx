// 用户增长模块主页
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SegmentStats {
  vip: number;
  active: number;
  at_risk: number;
  lost: number;
  new: number;
}

interface GrowthMetrics {
  total_customers: number;
  segment_stats: SegmentStats;
  avg_ltv: number;
}

export default function GrowthDashboard() {
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/growth/rfm/analyze');
      if (!response.ok) {
        throw new Error('Failed to fetch growth metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching growth metrics:', err);
      // 设置默认空数据
      setMetrics({
        total_customers: 0,
        segment_stats: { vip: 0, active: 0, at_risk: 0, lost: 0, new: 0 },
        avg_ltv: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const runRFMAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/growth/rfm/analyze', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to run RFM analysis');
      }
      await fetchMetrics();
    } catch (err) {
      console.error('Error running RFM analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 如果有错误但有默认数据,继续显示页面

  const segmentColors = {
    vip: 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    at_risk: 'bg-yellow-100 text-yellow-800',
    lost: 'bg-red-100 text-red-800',
    new: 'bg-blue-100 text-blue-800',
  };

  const segmentLabels = {
    vip: 'VIP客户',
    active: '活跃客户',
    at_risk: '流失风险',
    lost: '已流失',
    new: '新客户',
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">用户增长仪表板</h1>
          <p className="text-gray-600">客户数据洞察与留存分析</p>
        </div>
        <button
          onClick={runRFMAnalysis}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          运行RFM分析
        </button>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总客户数</p>
          <p className="text-2xl font-bold text-gray-900">
            {metrics?.total_customers || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">平均LTV</p>
          <p className="text-2xl font-bold text-green-600">
            ${(metrics?.avg_ltv || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">VIP客户</p>
          <p className="text-2xl font-bold text-purple-600">
            {metrics?.segment_stats?.vip || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">流失风险</p>
          <p className="text-2xl font-bold text-yellow-600">
            {metrics?.segment_stats?.at_risk || 0}
          </p>
        </div>
      </div>

      {/* 客户分层 */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">客户分层分布</h2>
        </div>
        <div className="p-6">
          {metrics?.total_customers === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无客户数据</h3>
              <p className="text-gray-600 mb-6">
                连接您的CRM系统或导入客户数据开始分析
              </p>
              <a
                href="/integrations"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                连接CRM系统
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {metrics?.segment_stats &&
                Object.entries(metrics.segment_stats).map(([segment, count]) => (
                  <div
                    key={segment}
                    className={`p-4 rounded-lg ${
                      segmentColors[segment as keyof SegmentStats]
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {segmentLabels[segment as keyof SegmentStats]}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs mt-1">
                      {metrics.total_customers > 0
                        ? ((count / metrics.total_customers) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link
          href="/growth/customers"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">客户列表</h3>
          <p className="text-sm text-gray-600">查看和筛选所有客户</p>
        </Link>
        <Link
          href="/growth/rfm"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">RFM分析</h3>
          <p className="text-sm text-gray-600">客户价值分层和洞察</p>
        </Link>
        <Link
          href="/growth/automation"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">自动化营销</h3>
          <p className="text-sm text-gray-600">配置和管理自动化规则</p>
        </Link>
        <Link
          href="/growth/analytics"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">行为分析</h3>
          <p className="text-sm text-gray-600">用户行为路径和事件追踪</p>
        </Link>
      </div>
    </div>
  );
}
