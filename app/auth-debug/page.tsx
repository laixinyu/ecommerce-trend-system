'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AuthDebugPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [sessionInfo, setSessionInfo] = useState<unknown>(null);

  useEffect(() => {
    // 获取当前会话信息
    supabase.auth.getSession().then(({ data }) => {
      setSessionInfo(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">认证调试页面</h1>

        <div className="space-y-6">
          {/* 加载状态 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">加载状态</h2>
            <p className="text-lg">
              {loading ? (
                <span className="text-yellow-600">⏳ 加载中...</span>
              ) : (
                <span className="text-green-600">✓ 已加载</span>
              )}
            </p>
          </div>

          {/* 用户信息 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">用户信息</h2>
            {user ? (
              <div className="space-y-2">
                <p>
                  <strong>ID:</strong> {user.id}
                </p>
                <p>
                  <strong>邮箱:</strong> {user.email}
                </p>
                <p>
                  <strong>邮箱已验证:</strong>{' '}
                  {user.email_confirmed_at ? '✓ 是' : '✗ 否'}
                </p>
                <p>
                  <strong>创建时间:</strong>{' '}
                  {new Date(user.created_at || '').toLocaleString('zh-CN')}
                </p>
                <p>
                  <strong>最后登录:</strong>{' '}
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString('zh-CN')
                    : '-'}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">未登录</p>
            )}
          </div>

          {/* 会话信息 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">会话信息</h2>
            {session ? (
              <div className="space-y-2">
                <p>
                  <strong>访问令牌:</strong>{' '}
                  <span className="font-mono text-xs">
                    {session.access_token.substring(0, 20)}...
                  </span>
                </p>
                <p>
                  <strong>刷新令牌:</strong>{' '}
                  <span className="font-mono text-xs">
                    {session.refresh_token?.substring(0, 20)}...
                  </span>
                </p>
                <p>
                  <strong>过期时间:</strong>{' '}
                  {session.expires_at
                    ? new Date(session.expires_at * 1000).toLocaleString('zh-CN')
                    : '-'}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">无会话</p>
            )}
          </div>

          {/* 原始会话数据 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">原始会话数据</h2>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              前往仪表板
            </button>
            <button
              onClick={() => router.push('/login')}
              className="rounded-lg bg-gray-600 px-6 py-3 text-white hover:bg-gray-700"
            >
              前往登录页
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
