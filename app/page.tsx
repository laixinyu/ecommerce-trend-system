export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            电商流行趋势系统
          </h1>
          <p className="text-xl text-gray-600">
            快速获取全球流行趋势，智能分析市场机会
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 text-4xl">🕷️</div>
            <h3 className="mb-2 text-lg font-semibold">真实爬虫</h3>
            <p className="text-sm text-gray-600">
              使用Puppeteer实时采集Amazon、AliExpress商品数据
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold">多平台数据</h3>
            <p className="text-sm text-gray-600">
              聚合多个主流跨境电商平台的趋势数据
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 text-4xl">🎯</div>
            <h3 className="mb-2 text-lg font-semibold">智能推荐</h3>
            <p className="text-sm text-gray-600">
              基于趋势、竞争度和利润空间的智能商品推荐
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 text-4xl">📈</div>
            <h3 className="mb-2 text-lg font-semibold">趋势分析</h3>
            <p className="text-sm text-gray-600">
              实时监控市场动态，捕捉新兴趋势机会
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href="/register"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            开始使用
          </a>
          <a
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            登录
          </a>
        </div>
      </main>
    </div>
  );
}
