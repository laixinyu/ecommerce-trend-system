'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart } from '@/components/ui/charts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TimeRange = '30' | '90' | '180';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // 实时联想
  useEffect(() => {
    if (keyword.length >= 2) {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(keyword)}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data.suggestions || []))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [keyword]);

  // 执行搜索
  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setSearchQuery(keyword);
    setLoading(true);

    try {
      // 搜索商品
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
      const searchData = await searchRes.json();
      setSearchResults(searchData.results || []);

      // 获取相关关键词
      const relatedRes = await fetch(`/api/search/related?keyword=${encodeURIComponent(keyword)}`);
      const relatedData = await relatedRes.json();
      setRelatedKeywords(relatedData.related || []);

      // 模拟趋势数据（实际应该从API获取）
      const labels = generateDateLabels(parseInt(timeRange));
      const values = generateMockTrendData(parseInt(timeRange));
      const chartData = labels.map((date, index) => ({
        date,
        value: values[index],
      }));
      setTrendData(chartData);

      // 保存到搜索历史
      const newHistory = [keyword, ...searchHistory.filter((h) => h !== keyword)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成日期标签
  const generateDateLabels = (days: number) => {
    const labels = [];
    for (let i = days; i >= 0; i -= Math.floor(days / 10)) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    }
    return labels;
  };

  // 生成模拟趋势数据
  const generateMockTrendData = (days: number) => {
    return Array.from({ length: 11 }, () => Math.floor(Math.random() * 100) + 20);
  };

  // 低搜索量警告
  const isLowSearchVolume = searchResults.length < 5;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 搜索框 */}
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入关键词搜索商品趋势..."
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setKeyword(suggestion);
                        setSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>
          </div>

          {/* 搜索历史 */}
          {searchHistory.length > 0 && !searchQuery && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">搜索历史：</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setKeyword(item);
                      handleSearch();
                    }}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {searchQuery && (
          <>
            {/* 低搜索量警告 */}
            {isLowSearchVolume && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">搜索量较低</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    该关键词的搜索结果较少，可能市场需求不足或竞争较小。建议尝试相关关键词或调整搜索条件。
                  </p>
                </div>
              </div>
            )}

            {/* 趋势图表 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  关键词趋势：{searchQuery}
                </h2>
                <div className="flex gap-2">
                  {(['30', '90', '180'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        timeRange === range
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {range}天
                    </button>
                  ))}
                </div>
              </div>
              {trendData && trendData.length > 0 && (
                <LineChart 
                  data={trendData} 
                  xKey="date" 
                  yKey="value" 
                  height={300} 
                />
              )}
            </Card>

            {/* 搜索结果 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                搜索结果 ({searchResults.length})
              </h2>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>平台: {product.platform}</p>
                        <p>价格: ¥{product.price}</p>
                        <p>趋势分数: {product.trend_score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">未找到相关商品</p>
              )}
            </Card>

            {/* 相关关键词 */}
            {relatedKeywords.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">相关关键词推荐</h2>
                <div className="flex flex-wrap gap-3">
                  {relatedKeywords.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setKeyword(item.keyword);
                        handleSearch();
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-2"
                    >
                      {item.keyword}
                      <span className="text-xs text-blue-500">({item.frequency})</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
