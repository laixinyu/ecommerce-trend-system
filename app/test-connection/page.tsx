'use client';

import { useEffect, useState } from 'react';

export default function TestConnectionPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const testResults: any = {
        timestamp: new Date().toISOString(),
        environment: {},
        network: {},
        supabase: {},
      };

      // 测试环境变量
      testResults.environment = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      };

      // 测试网络连接
      try {
        const response = await fetch('/api/trends/products?limit=1');
        testResults.network.productsApi = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        };
        if (response.ok) {
          const data = await response.json();
          testResults.network.productsApiData = data;
        }
      } catch (error: any) {
        testResults.network.productsApi = {
          error: error.message,
        };
      }

      // 测试 Supabase 连接
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data, error } = await supabase.auth.getSession();
        testResults.supabase.session = {
          hasSession: !!data.session,
          error: error?.message,
        };
      } catch (error: any) {
        testResults.supabase.session = {
          error: error.message,
        };
      }

      setResults(testResults);
      setLoading(false);
    };

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <p className="text-gray-600">正在测试连接...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">连接测试</h1>

        <div className="space-y-6">
          {/* 环境变量 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">环境变量</h2>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(results.environment, null, 2)}
            </pre>
          </div>

          {/* 网络测试 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">网络连接</h2>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(results.network, null, 2)}
            </pre>
          </div>

          {/* Supabase 测试 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Supabase 连接</h2>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(results.supabase, null, 2)}
            </pre>
          </div>

          {/* 完整结果 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">完整测试结果</h2>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              重新测试
            </button>
            <a
              href="/dashboard"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              返回仪表板
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
