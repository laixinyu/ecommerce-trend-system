'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">电商流行趋势系统</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => router.push('/profile')}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                个人中心
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">欢迎回来！</h2>
          <p className="mt-2 text-gray-600">这是你的趋势分析仪表板</p>
        </div>

        {/* 核心功能区 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">核心功能</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/products"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 text-4xl">📦</div>
              <h3 className="mb-2 text-lg font-semibold">商品列表</h3>
              <p className="text-sm text-gray-600">浏览所有跨境电商商品数据</p>
            </Link>

            <Link
              href="/search"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 text-4xl">🔍</div>
              <h3 className="mb-2 text-lg font-semibold">搜索分析</h3>
              <p className="text-sm text-gray-600">智能搜索和趋势分析</p>
            </Link>

            <Link
              href="/compare"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 text-4xl">⚖️</div>
              <h3 className="mb-2 text-lg font-semibold">商品对比</h3>
              <p className="text-sm text-gray-600">对比不同商品的趋势数据</p>
            </Link>

            <Link
              href="/reports"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold">趋势报告</h3>
              <p className="text-sm text-gray-600">生成和导出趋势分析报告</p>
            </Link>

            <Link
              href="/admin/real-crawler"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow border-2 border-blue-100"
            >
              <div className="mb-4 text-4xl">🕷️</div>
              <h3 className="mb-2 text-lg font-semibold text-blue-900">爬虫管理</h3>
              <p className="text-sm text-gray-600">启动真实爬虫采集商品数据</p>
              <div className="mt-3 inline-flex items-center text-xs text-blue-600">
                <span className="mr-1">⚡</span>
                <span>实时数据采集</span>
              </div>
            </Link>

            <Link
              href="/profile"
              className="block rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 text-4xl">👤</div>
              <h3 className="mb-2 text-lg font-semibold">个人中心</h3>
              <p className="text-sm text-gray-600">管理你的账号和偏好设置</p>
            </Link>
          </div>
        </div>

        {/* 数字化能力扩展 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">数字化能力</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/marketing"
              className="block rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 p-6 shadow hover:shadow-lg transition-shadow border border-pink-100"
            >
              <div className="mb-4 text-4xl">📢</div>
              <h3 className="mb-2 text-lg font-semibold text-pink-900">营销数字化</h3>
              <p className="text-sm text-gray-600">跨平台广告效果分析和优化</p>
              <div className="mt-3 text-xs text-pink-600">Meta Ads · Google Ads · SEO</div>
            </Link>

            <Link
              href="/growth"
              className="block rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow hover:shadow-lg transition-shadow border border-green-100"
            >
              <div className="mb-4 text-4xl">👥</div>
              <h3 className="mb-2 text-lg font-semibold text-green-900">用户增长</h3>
              <p className="text-sm text-gray-600">客户数据洞察与留存分析</p>
              <div className="mt-3 text-xs text-green-600">RFM分析 · 自动化营销</div>
            </Link>

            <Link
              href="/content"
              className="block rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 p-6 shadow hover:shadow-lg transition-shadow border border-purple-100"
            >
              <div className="mb-4 text-4xl">🎨</div>
              <h3 className="mb-2 text-lg font-semibold text-purple-900">内容运营</h3>
              <p className="text-sm text-gray-600">AI内容生成和社媒管理</p>
              <div className="mt-3 text-xs text-purple-600">AI生成 · 资产管理</div>
            </Link>

            <Link
              href="/supply-chain"
              className="block rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow hover:shadow-lg transition-shadow border border-orange-100"
            >
              <div className="mb-4 text-4xl">📦</div>
              <h3 className="mb-2 text-lg font-semibold text-orange-900">供应链</h3>
              <p className="text-sm text-gray-600">库存管理和订单追踪</p>
              <div className="mt-3 text-xs text-orange-600">库存 · 订单 · 物流</div>
            </Link>
          </div>
        </div>

        {/* 智能决策 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">智能决策</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/intelligence"
              className="block rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow hover:shadow-lg transition-shadow border-2 border-blue-200"
            >
              <div className="mb-4 text-4xl">🧠</div>
              <h3 className="mb-2 text-lg font-semibold text-blue-900">智能决策中心</h3>
              <p className="text-sm text-gray-600">统一数据仪表板、AI预测和自动化工作流</p>
              <div className="mt-3 inline-flex items-center text-xs text-blue-600">
                <span className="mr-1">✨</span>
                <span>AI驱动</span>
              </div>
            </Link>

            <Link
              href="/modules"
              className="block rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 p-6 shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="mb-4 text-4xl">🔧</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">模块管理</h3>
              <p className="text-sm text-gray-600">管理和配置系统功能模块</p>
              <div className="mt-3 text-xs text-gray-600">启用/禁用功能模块</div>
            </Link>

            <Link
              href="/integrations"
              className="block rounded-lg bg-gradient-to-br from-cyan-50 to-sky-50 p-6 shadow hover:shadow-lg transition-shadow border border-cyan-100"
            >
              <div className="mb-4 text-4xl">🔗</div>
              <h3 className="mb-2 text-lg font-semibold text-cyan-900">集成管理</h3>
              <p className="text-sm text-gray-600">连接第三方平台和服务</p>
              <div className="mt-3 text-xs text-cyan-600">OAuth · API集成</div>
            </Link>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600">用户ID</p>
            <p className="mt-2 text-xs font-mono text-gray-900">{user?.id}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600">注册时间</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-gray-600">账号状态</p>
            <p className="mt-2 text-sm font-medium text-green-600">✓ 正常</p>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 rounded-lg bg-blue-50 border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900">💡 温馨提示</h3>
          <p className="mt-2 text-sm text-blue-700">
            系统正在开发中，部分功能可能还未完善。如遇到问题，请查看控制台日志或联系开发团队。
          </p>
        </div>
      </div>
    </div>
  );
}
