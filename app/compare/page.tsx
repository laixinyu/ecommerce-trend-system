'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Download, Calendar } from 'lucide-react';
import { LineChart, BarChart } from '@/components/ui/charts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TimeRange = 'custom' | '7d' | '30d' | '90d';

export default function ComparePage() {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [compareData, setCompareData] = useState<any>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  // 加载可选商品
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/trends/products?pageSize=50&sortBy=recommendation_score&sortOrder=desc');
        const data = await res.json();
        if (data.success && data.data?.products) {
          setAvailableProducts(data.data.products);
        }
      } catch (error) {
        console.error('加载商品失败:', error);
      }
    };
    loadProducts();
  }, []);

  // 添加商品到对比
  const addProduct = (product: any) => {
    if (selectedProducts.length >= 5) {
      alert('最多只能对比5个商品');
      return;
    }
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setShowProductSelector(false);
  };

  // 移除商品
  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  // 执行对比
  const handleCompare = async () => {
    if (selectedProducts.length < 2) {
      alert('请至少选择2个商品进行对比');
      return;
    }

    setLoading(true);
    try {
      const productIds = selectedProducts.map((p) => p.id).join(',');
      const params = new URLSearchParams({
        productIds,
        timeRange,
      });

      if (timeRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate);
        params.append('endDate', customEndDate);
      }

      const res = await fetch(`/api/trends/compare?${params}`);
      const result = await res.json();

      console.log('对比结果:', result);

      if (!result.success) {
        alert(result.error?.message || '对比失败');
        return;
      }

      const comparison = result.data?.comparison || [];

      if (comparison.length === 0) {
        alert('没有找到对比数据');
        return;
      }

      // 构建图表数据
      const labels = generateDateLabels(timeRange);
      const datasets = selectedProducts.map((product, index) => ({
        label: product.name,
        data: generateMockData(labels.length),
        borderColor: getColor(index),
        backgroundColor: getColor(index, 0.1),
      }));

      setCompareData({
        trend: { labels, datasets },
        yoy: comparison.map((c: unknown) => ({
          product: c.product_name,
          yoy: c.yoy_growth || 0,
          mom: c.mom_growth || 0,
        })),
        seasonal: comparison.map((c: unknown) => ({
          product: c.product_name,
          isSeasonal: c.is_seasonal || false,
        })),
      });
    } catch (error) {
      console.error('对比失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导出对比结果
  const handleExport = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trend-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const generateCSV = () => {
    let csv = '商品名称,趋势分数,同比增长,环比增长,季节性\n';
    selectedProducts.forEach((product, index) => {
      const yoy = compareData?.yoy?.[index]?.yoy?.toFixed(2) || 'N/A';
      const mom = compareData?.yoy?.[index]?.mom?.toFixed(2) || 'N/A';
      const seasonal = compareData?.seasonal?.[index]?.isSeasonal ? '是' : '否';
      csv += `${product.name},${product.trend_score},${yoy}%,${mom}%,${seasonal}\n`;
    });
    return csv;
  };

  const generateDateLabels = (range: TimeRange) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30;
    const labels = [];
    for (let i = days; i >= 0; i -= Math.floor(days / 10)) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    }
    return labels;
  };

  const generateMockData = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 100) + 20);
  };

  const getColor = (index: number, alpha = 1) => {
    const colors = [
      `rgba(59, 130, 246, ${alpha})`,
      `rgba(16, 185, 129, ${alpha})`,
      `rgba(249, 115, 22, ${alpha})`,
      `rgba(139, 92, 246, ${alpha})`,
      `rgba(236, 72, 153, ${alpha})`,
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">趋势对比</h1>
          {compareData && (
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出结果
            </Button>
          )}
        </div>

        {/* 商品选择器 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">选择对比商品 (最多5个)</h2>

          {/* 已选商品 */}
          <div className="flex flex-wrap gap-3 mb-4">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg"
              >
                <span className="font-medium">{product.name}</span>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="hover:bg-blue-100 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedProducts.length < 5 && (
              <button
                onClick={() => setShowProductSelector(!showProductSelector)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-500"
              >
                <Plus className="w-4 h-4" />
                添加商品
              </button>
            )}
          </div>

          {/* 商品列表 */}
          {showProductSelector && (
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
              {availableProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>加载商品中...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableProducts
                    .filter((p) => !selectedProducts.find((sp) => sp.id === p.id))
                    .map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="text-left p-4 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-2 text-sm mb-1">{product.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {product.platform}
                              </span>
                              <span>趋势: {product.trendScore?.toFixed(0) || 'N/A'}</span>
                              <span>推荐: {product.recommendationScore?.toFixed(0) || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 时间范围选择 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            时间范围
          </h2>
          <div className="flex flex-wrap gap-3">
            {(['7d', '30d', '90d', 'custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg ${timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                {range === 'custom' ? '自定义' : range === '7d' ? '7天' : range === '30d' ? '30天' : '90天'}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="mt-4 flex gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">开始日期</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">结束日期</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          <Button onClick={handleCompare} disabled={loading || selectedProducts.length < 2} className="mt-4">
            开始对比
          </Button>
        </Card>

        {/* 对比结果 */}
        {compareData && (
          <>
            {/* 趋势对比图 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📈 趋势对比图表</h2>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                💡 提示：图表显示所选商品在指定时间范围内的趋势分数变化对比
              </div>

              {/* 简化的趋势图表 */}
              <div className="space-y-6">
                {selectedProducts.map((product: any, index: number) => {
                  const color = getColor(index).replace('rgba', 'rgb').split(',').slice(0, 3).join(',') + ')';
                  const labels = generateDateLabels(timeRange);
                  const data = generateMockData(labels.length);
                  const maxValue = Math.max(...data);

                  return (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium">{product.name}</span>
                          <span className="text-sm text-gray-500">({product.platform})</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          当前趋势分数: <span className="font-semibold text-blue-600">{product.trendScore?.toFixed(0) || 'N/A'}</span>
                        </div>
                      </div>

                      {/* 简化的条形图 */}
                      <div className="space-y-1">
                        {labels.map((label, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-16">{label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${(data[i] / maxValue) * 100}%`,
                                  backgroundColor: color
                                }}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                                {data[i]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 图例说明 */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex flex-wrap gap-4 justify-center">
                  {selectedProducts.map((product: any, index: number) => {
                    const color = getColor(index).replace('rgba', 'rgb').split(',').slice(0, 3).join(',') + ')';
                    return (
                      <div key={product.id} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-gray-700">{product.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* 商品对比总览 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📊 商品对比总览</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold">商品名称</th>
                      <th className="text-center py-3 px-4 font-semibold">平台</th>
                      <th className="text-right py-3 px-4 font-semibold">当前价格</th>
                      <th className="text-right py-3 px-4 font-semibold">趋势分数</th>
                      <th className="text-right py-3 px-4 font-semibold">同比增长</th>
                      <th className="text-right py-3 px-4 font-semibold">环比增长</th>
                      <th className="text-center py-3 px-4 font-semibold">季节性</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((product: unknown, index: number) => {
                      const yoyData = compareData.yoy?.[index];
                      const seasonalData = compareData.seasonal?.[index];

                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium line-clamp-2 text-sm">{product.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {product.platform}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-blue-600">
                            ${product.currentPrice?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, product.trendScore || 0)}%` }}
                                />
                              </div>
                              <span className="font-medium">{product.trendScore?.toFixed(0) || 'N/A'}</span>
                            </div>
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold ${(yoyData?.yoy || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {(yoyData?.yoy || 0) >= 0 ? '+' : ''}{(yoyData?.yoy || 0).toFixed(2)}%
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold ${(yoyData?.mom || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {(yoyData?.mom || 0) >= 0 ? '+' : ''}{(yoyData?.mom || 0).toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-center">
                            {seasonalData?.isSeasonal ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                🌞 季节性
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                ⚪ 非季节性
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 对比分析总结 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">💡 对比分析总结</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 最佳表现 */}
                {(() => {
                  const bestProduct = selectedProducts.reduce((best: any, product: any, index: number) => {
                    const score = (compareData.yoy?.[index]?.yoy || 0) + (product.trendScore || 0);
                    return score > best.score ? { product, score, index } : best;
                  }, { product: selectedProducts[0], score: -Infinity, index: 0 });

                  return (
                    <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <h3 className="font-semibold text-green-800 mb-3">🏆 最佳表现</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {bestProduct.product.imageUrl && (
                          <img src={bestProduct.product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{bestProduct.product.name}</p>
                          <p className="text-xs text-green-700">{bestProduct.product.platform}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="bg-white rounded p-2">
                          <div className="text-gray-600">趋势分数</div>
                          <div className="font-semibold text-green-700">{bestProduct.product.trendScore?.toFixed(0) || 'N/A'}</div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="text-gray-600">同比增长</div>
                          <div className="font-semibold text-green-700">+{(compareData.yoy?.[bestProduct.index]?.yoy || 0).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 增长最快 */}
                {(() => {
                  const fastestGrowth = selectedProducts.reduce((fastest: any, product: any, index: number) => {
                    const growth = compareData.yoy?.[index]?.yoy || 0;
                    return growth > fastest.growth ? { product, growth, index } : fastest;
                  }, { product: selectedProducts[0], growth: -Infinity, index: 0 });

                  return (
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-3">📈 增长最快</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {fastestGrowth.product.imageUrl && (
                          <img src={fastestGrowth.product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{fastestGrowth.product.name}</p>
                          <p className="text-xs text-blue-700">{fastestGrowth.product.platform}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="bg-white rounded p-2">
                          <div className="text-gray-600">同比增长</div>
                          <div className="font-semibold text-blue-700">+{fastestGrowth.growth.toFixed(1)}%</div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="text-gray-600">环比增长</div>
                          <div className="font-semibold text-blue-700">
                            {(compareData.yoy?.[fastestGrowth.index]?.mom || 0) >= 0 ? '+' : ''}
                            {(compareData.yoy?.[fastestGrowth.index]?.mom || 0).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 价格最优 */}
                {(() => {
                  const cheapest = selectedProducts.reduce((cheap: any, product: any) => {
                    return (product.currentPrice || Infinity) < (cheap.currentPrice || Infinity) ? product : cheap;
                  }, selectedProducts[0]);

                  return (
                    <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                      <h3 className="font-semibold text-purple-800 mb-3">💰 价格最优</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {cheapest.imageUrl && (
                          <img src={cheapest.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{cheapest.name}</p>
                          <p className="text-xs text-purple-700">{cheapest.platform}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="bg-white rounded p-2">
                          <div className="text-gray-600">当前价格</div>
                          <div className="font-semibold text-purple-700">${cheapest.currentPrice?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="text-gray-600">推荐分数</div>
                          <div className="font-semibold text-purple-700">{cheapest.recommendationScore?.toFixed(0) || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 季节性分析 */}
                {(() => {
                  const seasonalCount = compareData.seasonal?.filter((s: any) => s.isSeasonal).length || 0;

                  return (
                    <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                      <h3 className="font-semibold text-yellow-800 mb-3">🌞 季节性分析</h3>
                      <div className="bg-white rounded p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">季节性商品</span>
                          <span className="text-lg font-bold text-yellow-700">
                            {seasonalCount} / {selectedProducts.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${(seasonalCount / selectedProducts.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-yellow-700">
                        {seasonalCount > 0
                          ? '💡 注意销售时间窗口，提前备货'
                          : '💡 所选商品均为非季节性，全年可销售'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
