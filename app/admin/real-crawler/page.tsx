'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CrawlResult {
  platform: string;
  keyword: string;
  productsFound: number;
  productsSaved: number;
  success: boolean;
  error?: string;
  duration: number;
}

interface CrawlStats {
  totalCrawls: number;
  successfulCrawls: number;
  failedCrawls: number;
  totalProducts: number;
  byPlatform: {
    amazon: number;
    aliexpress: number;
  };
}

interface Keyword {
  id: string;
  keyword: string;
  search_volume: number;
  competition_level: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
}

export default function RealCrawlerPage() {
  const [platform, setPlatform] = useState<'amazon' | 'aliexpress'>('amazon');
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [maxPages, setMaxPages] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [useCustomKeyword, setUseCustomKeyword] = useState(false);

  // 加载关键词和分类
  const loadKeywordsAndCategories = useCallback(async () => {
    setLoadingData(true);
    try {
      const [keywordsRes, categoriesRes] = await Promise.all([
        fetch('/api/keywords'),
        fetch(`/api/categories?platform=${platform}`),
      ]);

      const keywordsData = await keywordsRes.json();
      const categoriesData = await categoriesRes.json();

      if (keywordsData.success) {
        setKeywords(keywordsData.data);
        // 如果有关键词，默认选择第一个
        if (keywordsData.data.length > 0) {
          setKeyword(keywordsData.data[0].keyword);
          if (keywordsData.data[0].category_id) {
            setCategoryId(keywordsData.data[0].category_id);
          }
        }
      }

      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoadingData(false);
    }
  }, [platform]);

  useEffect(() => {
    loadKeywordsAndCategories();
  }, [loadKeywordsAndCategories]);

  const handleCrawl = async () => {
    if (!categoryId) {
      alert('请选择分类');
      return;
    }
    
    if (!keyword && !useCustomKeyword) {
      // 如果没有关键词且不是自定义输入模式，提示用户
      const confirmed = confirm('未输入关键词，将爬取整个类目下的商品。是否继续？');
      if (!confirmed) return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/crawl/real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          keyword,
          categoryId,
          maxPages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        
        // 显示成功消息
        if (data.data.productsSaved > 0) {
          // 自动跳转到商品列表
          setTimeout(() => {
            window.location.href = '/products';
          }, 2000);
        }
      } else {
        alert(`爬取失败: ${data.error}`);
      }
    } catch (error) {
      console.error('Crawl error:', error);
      alert('爬取失败，请查看控制台');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/crawl/real');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">真实爬虫控制台</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">爬取配置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">平台</label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as 'amazon' | 'aliexpress');
                setCategoryId(''); // 切换平台时清空类目选择
              }}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              <option value="amazon">Amazon</option>
              <option value="aliexpress">AliExpress</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">搜索关键词（可选）</label>
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useCustomKeyword}
                  onChange={(e) => setUseCustomKeyword(e.target.checked)}
                  className="mr-1"
                />
                自定义输入
              </label>
            </div>
            
            {useCustomKeyword ? (
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="留空则爬取整个类目，或输入关键词如: wireless earbuds"
                className="w-full p-2 border rounded"
                disabled={loading}
              />
            ) : (
              <select
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  // 自动填充对应的分类ID
                  const selectedKeyword = keywords.find(k => k.keyword === e.target.value);
                  if (selectedKeyword?.category_id) {
                    setCategoryId(selectedKeyword.category_id);
                  }
                }}
                className="w-full p-2 border rounded"
                disabled={loading || loadingData}
              >
                <option value="">不使用关键词（爬取整个类目）</option>
                {loadingData ? (
                  <option>加载中...</option>
                ) : keywords.length === 0 ? (
                  <option disabled>暂无关键词</option>
                ) : (
                  keywords.map((kw) => (
                    <option key={kw.id} value={kw.keyword}>
                      {kw.keyword} (搜索量: {kw.search_volume.toLocaleString()})
                    </option>
                  ))
                )}
              </select>
            )}
            
            <p className="text-sm text-gray-500 mt-1">
              💡 不输入关键词时，将按类目浏览爬取商品
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading || loadingData}
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'　'.repeat(cat.level)}{cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && !loadingData && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ 数据库中暂无分类，请先添加分类数据
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              爬取页数 (1-5)
            </label>
            <input
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max="5"
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleCrawl}
            disabled={loading}
            className="w-full"
          >
            {loading ? '爬取中...' : '开始爬取'}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className={`p-6 mb-6 ${result.success && result.productsSaved > 0 ? 'border-2 border-green-500' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">
            {result.success && result.productsSaved > 0 ? '✅ 爬取成功！' : '爬取结果'}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">平台:</span>
              <span>{result.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">关键词:</span>
              <span>{result.keyword || '（按类目爬取）'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">找到商品:</span>
              <span>{result.productsFound}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">保存商品:</span>
              <span className="text-green-600 font-bold">{result.productsSaved}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">耗时:</span>
              <span>{(result.duration / 1000).toFixed(2)} 秒</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">状态:</span>
              <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? '成功' : '失败'}
              </span>
            </div>
            {result.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <span className="text-red-600">{result.error}</span>
              </div>
            )}
          </div>
          
          {result.success && result.productsSaved > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-center">
                <p className="text-green-700 font-medium">
                  🎉 已成功添加 {result.productsSaved} 个商品到数据库
                </p>
                <p className="text-sm text-green-600 mt-1">
                  正在跳转到商品列表...
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/products'}
                className="w-full"
              >
                立即前往商品列表 →
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">爬取统计 (最近 7 天)</h2>
          <Button onClick={loadStats} variant="outline" size="sm">
            刷新统计
          </Button>
        </div>

        {stats ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">总爬取次数:</span>
              <span>{stats.totalCrawls}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">成功次数:</span>
              <span className="text-green-600">{stats.successfulCrawls}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">失败次数:</span>
              <span className="text-red-600">{stats.failedCrawls}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">总商品数:</span>
              <span className="font-bold">{stats.totalProducts}</span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="font-medium mb-2">按平台统计:</div>
              <div className="flex justify-between ml-4">
                <span>Amazon:</span>
                <span>{stats.byPlatform.amazon}</span>
              </div>
              <div className="flex justify-between ml-4">
                <span>AliExpress:</span>
                <span>{stats.byPlatform.aliexpress}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">点击&ldquo;刷新统计&rdquo;加载数据</p>
        )}
      </Card>

      <Card className="p-6 mt-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold mb-2">⚠️ 使用说明</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• 真实爬虫会访问实际网站，请遵守网站的服务条款</li>
          <li>• 爬取速度较慢，每页需要 2-4 秒，请耐心等待</li>
          <li>• 建议使用代理服务器以避免 IP 被封禁</li>
          <li>• 首次运行会下载 Chromium，可能需要几分钟</li>
          <li>• 生产环境建议使用官方 API 而非爬虫</li>
        </ul>
      </Card>
    </div>
  );
}
