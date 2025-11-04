// 营销模块主页
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PlatformSummary {
  platform: string;
  totalSpend: number;
  totalRevenue: number;
  averageROAS: number;
  totalConversions: number;
  campaignCount: number;
}

export default function MarketingDashboard() {
  const [platformSummary, setPlatformSummary] = useState<PlatformSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformSummary();
  }, []);

  const fetchPlatformSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketing/analytics?type=platform_summary');
      if (!response.ok) {
        throw new Error('Failed to fetch platform summary');
      }
      const result = await response.json();
      setPlatformSummary(result.data || []);
    } catch (err) {
      console.error('Error fetching platform summary:', err);
      setPlatformSummary([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 移除错误显示,改为在页面中显示提示

  const totalSpend = platformSummary.reduce((sum, p) => sum + p.totalSpend, 0);
  const totalRevenue = platformSummary.reduce((sum, p) => sum + p.totalRevenue, 0);
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">营销仪表板</h1>
        <p className="text-gray-600">跨平台广告效果分析和优化</p>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总支出</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalSpend.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总收入</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">整体ROAS</p>
          <p className="text-2xl font-bold text-green-600">
            {overallROAS.toFixed(2)}x
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">活跃平台</p>
          <p className="text-2xl font-bold text-gray-900">
            {platformSummary.length}
          </p>
        </div>
      </div>

      {/* 平台详情 */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">平台表现</h2>
        </div>
        <div className="p-6">
          {platformSummary.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无广告数据</h3>
              <p className="text-gray-600 mb-6">
                连接您的广告平台账号开始追踪营销效果
              </p>
              <a
                href="/integrations"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                连接广告平台
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {platformSummary.map((platform) => (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {platform.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {platform.campaignCount} 个广告活动
                    </p>
                  </div>
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-sm text-gray-600">支出</p>
                      <p className="font-semibold text-gray-900">
                        ${platform.totalSpend.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">收入</p>
                      <p className="font-semibold text-gray-900">
                        ${platform.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ROAS</p>
                      <p className="font-semibold text-green-600">
                        {platform.averageROAS.toFixed(2)}x
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">转化</p>
                      <p className="font-semibold text-gray-900">
                        {platform.totalConversions}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/marketing/campaigns"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">广告活动</h3>
          <p className="text-sm text-gray-600">查看和管理所有广告活动</p>
        </Link>
        <Link
          href="/marketing/analytics"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">深度分析</h3>
          <p className="text-sm text-gray-600">ROAS分析、转化漏斗、效果对比</p>
        </Link>
        <Link
          href="/marketing/seo"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">SEO数据</h3>
          <p className="text-sm text-gray-600">搜索控制台数据和关键词分析</p>
        </Link>
      </div>
    </div>
  );
}
