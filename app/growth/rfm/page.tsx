// RFM分析可视化页面
'use client';

import { useEffect, useState } from 'react';
import { CustomerSegment } from '@/types/crm';

interface SegmentStats {
  vip: number;
  active: number;
  at_risk: number;
  lost: number;
  new: number;
}

interface RFMStats {
  total_customers: number;
  segment_stats: SegmentStats;
  avg_ltv: number;
}

export default function RFMPage() {
  const [stats, setStats] = useState<RFMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/growth/rfm/analyze');
      if (!response.ok) {
        throw new Error('Failed to fetch RFM stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">错误: {error || '无法加载数据'}</p>
        </div>
      </div>
    );
  }

  const segmentData = [
    {
      segment: 'vip' as CustomerSegment,
      label: 'VIP客户',
      count: stats.segment_stats.vip,
      color: 'bg-purple-500',
      description: '高频高额近期购买的优质客户',
    },
    {
      segment: 'active' as CustomerSegment,
      label: '活跃客户',
      count: stats.segment_stats.active,
      color: 'bg-green-500',
      description: '近期有购买行为的客户',
    },
    {
      segment: 'at_risk' as CustomerSegment,
      label: '流失风险',
      count: stats.segment_stats.at_risk,
      color: 'bg-yellow-500',
      description: '曾经活跃但最近没有购买',
    },
    {
      segment: 'lost' as CustomerSegment,
      label: '已流失',
      count: stats.segment_stats.lost,
      color: 'bg-red-500',
      description: '长时间未购买的客户',
    },
    {
      segment: 'new' as CustomerSegment,
      label: '新客户',
      count: stats.segment_stats.new,
      color: 'bg-blue-500',
      description: '新注册或首次购买的客户',
    },
  ];

  const maxCount = Math.max(...segmentData.map((s) => s.count));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">RFM分析</h1>
        <p className="text-gray-600">客户价值分层和洞察</p>
      </div>

      {/* 总览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总客户数</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.total_customers}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">平均LTV</p>
          <p className="text-3xl font-bold text-green-600">
            ${stats.avg_ltv.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">VIP客户占比</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats.total_customers > 0
              ? ((stats.segment_stats.vip / stats.total_customers) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* 分层可视化 */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">客户分层分布</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {segmentData.map((segment) => (
              <div key={segment.segment}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${segment.color}`}></div>
                    <span className="font-medium text-gray-900">
                      {segment.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">
                      {segment.count}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      (
                      {stats.total_customers > 0
                        ? ((segment.count / stats.total_customers) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${segment.color} transition-all duration-500`}
                    style={{
                      width: `${maxCount > 0 ? (segment.count / maxCount) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{segment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RFM说明 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">RFM模型说明</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Recency (最近购买)
              </h3>
              <p className="text-sm text-gray-600">
                客户最后一次购买距今的时间。越近期购买的客户，越有可能再次购买。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Frequency (购买频次)
              </h3>
              <p className="text-sm text-gray-600">
                客户在一定时期内的购买次数。购买频次越高，客户忠诚度越高。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Monetary (消费金额)
              </h3>
              <p className="text-sm text-gray-600">
                客户在一定时期内的总消费金额。消费金额越高，客户价值越大。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
