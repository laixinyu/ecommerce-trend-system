// 客户详情页面
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Customer, CustomerSegment } from '@/types/crm';

interface CustomerProfile {
  customer: Customer;
  profile: {
    segment: CustomerSegment;
    rfm_score: {
      recency: number;
      frequency: number;
      monetary: number;
      total: number;
    };
    ltv: number;
    avg_order_value: number;
    purchase_frequency: string;
    customer_age_days: number;
    risk_level: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [data, setData] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerProfile();
  }, [customerId]);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/growth/customers/${customerId}/profile`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer profile');
      }
      const result = await response.json();
      setData(result);
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
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">错误: {error || '客户不存在'}</p>
        </div>
      </div>
    );
  }

  const { customer, profile } = data;

  const segmentColors: Record<CustomerSegment, string> = {
    vip: 'bg-purple-100 text-purple-800',
    active: 'bg-green-100 text-green-800',
    at_risk: 'bg-yellow-100 text-yellow-800',
    lost: 'bg-red-100 text-red-800',
    new: 'bg-blue-100 text-blue-800',
  };

  const riskColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer.name}</h1>
        <p className="text-gray-600">{customer.email}</p>
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">客户分层</p>
          <span
            className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
              segmentColors[profile.segment]
            }`}
          >
            {profile.segment.toUpperCase()}
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">生命周期价值</p>
          <p className="text-2xl font-bold text-green-600">
            ${profile.ltv.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">平均订单价值</p>
          <p className="text-2xl font-bold text-gray-900">
            ${profile.avg_order_value.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">流失风险</p>
          <p className={`text-2xl font-bold ${riskColors[profile.risk_level]}`}>
            {profile.risk_level.toUpperCase()}
          </p>
        </div>
      </div>

      {/* RFM评分 */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">RFM评分</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Recency (最近购买)</p>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">
                      {profile.rfm_score.recency}
                    </span>
                    <span className="text-sm text-gray-500">/5</span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${(profile.rfm_score.recency / 5) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Frequency (购买频次)</p>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      {profile.rfm_score.frequency}
                    </span>
                    <span className="text-sm text-gray-500">/5</span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-green-200">
                  <div
                    style={{
                      width: `${(profile.rfm_score.frequency / 5) * 100}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-600"
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Monetary (消费金额)</p>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-purple-600">
                      {profile.rfm_score.monetary}
                    </span>
                    <span className="text-sm text-gray-500">/5</span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-purple-200">
                  <div
                    style={{
                      width: `${(profile.rfm_score.monetary / 5) * 100}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600"
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">总分</p>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {profile.rfm_score.total}
                    </span>
                    <span className="text-sm text-gray-500">/15</span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${(profile.rfm_score.total / 15) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-900"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 购买统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总订单数</p>
          <p className="text-2xl font-bold text-gray-900">{customer.total_orders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">总消费金额</p>
          <p className="text-2xl font-bold text-gray-900">
            ${customer.total_spent.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">购买频率</p>
          <p className="text-2xl font-bold text-gray-900">
            {profile.purchase_frequency}
          </p>
        </div>
      </div>

      {/* 营销建议 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">营销建议</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {profile.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
