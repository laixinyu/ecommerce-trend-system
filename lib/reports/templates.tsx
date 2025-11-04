import React from 'react';

// 报告模板接口
export interface ReportData {
  title: string;
  generatedAt: string;
  dateRange: string;
  summary: {
    totalProducts: number;
    avgTrendScore: number;
    topCategory: string;
  };
  products?: any[];
  categories?: any[];
  platforms?: any[];
  trends?: any[];
}

// 趋势概览报告模板
export const TrendOverviewTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  return (
    <div className="report-container p-8 bg-white">
      <header className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
        <div className="mt-2 text-sm text-gray-600">
          <p>生成时间: {new Date(data.generatedAt).toLocaleString('zh-CN')}</p>
          <p>数据范围: {data.dateRange}</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">执行摘要</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">商品总数</p>
            <p className="text-2xl font-bold text-blue-600">{data.summary.totalProducts}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">平均趋势分数</p>
            <p className="text-2xl font-bold text-green-600">{data.summary.avgTrendScore}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">热门类目</p>
            <p className="text-xl font-bold text-purple-600">{data.summary.topCategory}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">热门商品</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">商品名称</th>
              <th className="border p-2 text-left">平台</th>
              <th className="border p-2 text-right">趋势分数</th>
              <th className="border p-2 text-right">价格</th>
            </tr>
          </thead>
          <tbody>
            {data.products?.slice(0, 10).map((product, index) => (
              <tr key={index}>
                <td className="border p-2">{product.name}</td>
                <td className="border p-2">{product.platform}</td>
                <td className="border p-2 text-right">{product.trend_score}</td>
                <td className="border p-2 text-right">¥{product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-8 pt-4 border-t text-sm text-gray-500">
        <p>本报告由电商趋势分析系统自动生成</p>
      </footer>
    </div>
  );
};

// 类目分析报告模板
export const CategoryAnalysisTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  return (
    <div className="report-container p-8 bg-white">
      <header className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
        <div className="mt-2 text-sm text-gray-600">
          <p>生成时间: {new Date(data.generatedAt).toLocaleString('zh-CN')}</p>
          <p>数据范围: {data.dateRange}</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">类目概览</h2>
        <div className="space-y-4">
          {data.categories?.map((category, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <span className="text-sm text-gray-600">{category.product_count} 个商品</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">平均趋势分数</p>
                  <p className="font-semibold">{category.avg_trend_score?.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-gray-600">平均价格</p>
                  <p className="font-semibold">¥{category.avg_price?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">竞争度</p>
                  <p className="font-semibold">{category.competition_level}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t text-sm text-gray-500">
        <p>本报告由电商趋势分析系统自动生成</p>
      </footer>
    </div>
  );
};

// 竞争分析报告模板
export const CompetitionAnalysisTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  return (
    <div className="report-container p-8 bg-white">
      <header className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
        <div className="mt-2 text-sm text-gray-600">
          <p>生成时间: {new Date(data.generatedAt).toLocaleString('zh-CN')}</p>
          <p>数据范围: {data.dateRange}</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">平台竞争分析</h2>
        <div className="space-y-4">
          {data.platforms?.map((platform, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-3">{platform.name}</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">商品数量</p>
                  <p className="font-semibold">{platform.product_count}</p>
                </div>
                <div>
                  <p className="text-gray-600">平均竞争度</p>
                  <p className="font-semibold">{platform.avg_competition?.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-gray-600">价格区间</p>
                  <p className="font-semibold">
                    ¥{platform.min_price} - ¥{platform.max_price}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">市场份额</p>
                  <p className="font-semibold">{platform.market_share}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">竞争机会分析</h2>
        <div className="space-y-3">
          {data.products?.filter((p) => p.competition_score < 50).slice(0, 5).map((product, index) => (
            <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                竞争度: {product.competition_score} | 趋势分数: {product.trend_score}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t text-sm text-gray-500">
        <p>本报告由电商趋势分析系统自动生成</p>
      </footer>
    </div>
  );
};
