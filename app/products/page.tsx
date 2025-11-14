'use client';

import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { ProductCard } from '@/components/features/product-card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { useCrawlerSync } from '@/hooks/use-crawler-sync';
import { useToast } from '@/hooks/use-toast';
import type { Product, Platform } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showNewDataBanner, setShowNewDataBanner] = useState(false);
  const [newProductsCount, setNewProductsCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'low_score' | 'all' | null>(null);
  const [scoreThreshold, setScoreThreshold] = useState(30); // 默认删除低于30分的商品
  const { toast } = useToast();

  // 筛选状态
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [sortBy, setSortBy] = useState('recommendation_score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 使用爬虫同步 Hook
  const { syncStatus, checkNow } = useCrawlerSync({
    enabled: true,
    interval: 60 * 1000, // 每 60 秒检查一次
    onNewData: (status) => {
      // 有新数据时显示横幅
      if (status.newProductsCount > 0) {
        setShowNewDataBanner(true);
        setNewProductsCount(status.newProductsCount);
      }
    },
  });

  const fetchProducts = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        sortBy,
        sortOrder: 'desc',
      });

      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform);
      }

      const response = await fetch(`/api/trends/products?${params}`);
      const result = await response.json();

      if (result.success) {
        setProducts(result.data.products);
        setTotalPages(result.data.pagination.totalPages);
        setTotalProducts(result.data.pagination.total);
        setLastUpdated(new Date());
        setShowNewDataBanner(false); // 刷新后隐藏横幅
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchProducts();
    checkNow(); // 同时检查同步状态
  };

  const handleBulkDelete = async (action: 'low_score' | 'delete_all') => {
    setDeleting(true);
    try {
      const response = await fetch('/api/trends/products/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action === 'low_score' ? 'delete_low_score' : 'delete_all',
          threshold: scoreThreshold, // 使用用户设置的阈值
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '删除成功',
          description: result.data.message,
          variant: 'default',
        });
        // 刷新列表
        setPage(1);
        fetchProducts();
      } else {
        throw new Error(result.error?.message || '删除失败');
      }
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedPlatform, sortBy]);

  const platforms: Array<{ value: Platform | 'all'; label: string }> = [
    { value: 'all', label: '全部平台' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'aliexpress', label: 'AliExpress' },
  ];

  const sortOptions = [
    { value: 'recommendation_score', label: '推荐评分' },
    { value: 'trend_score', label: '趋势分数' },
    { value: 'current_price', label: '价格' },
    { value: 'review_count', label: '评论数' },
  ];

  return (
    <PageLayout title="商品浏览" description="浏览和筛选热门商品">
      {/* 新数据提示横幅 */}
      {showNewDataBanner && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-semibold text-green-800">
                发现 {newProductsCount} 个新商品！
              </div>
              <div className="text-sm text-green-600">
                爬虫已完成数据采集，点击刷新查看最新商品
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleRefresh}
            >
              立即刷新
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewDataBanner(false)}
            >
              稍后
            </Button>
          </div>
        </div>
      )}

      {/* 统计信息栏 */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            共 <span className="font-semibold text-blue-600">{totalProducts}</span> 个商品
          </span>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
            </span>
          )}
          {syncStatus && (
            <span className="text-xs text-gray-400">
              • 自动检测中
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? '刷新中...' : '🔄 刷新'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeleteConfirm('low_score')}
            disabled={loading || deleting}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            🗑️ 删除低分商品
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeleteConfirm('all')}
            disabled={loading || deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            🗑️ 清空列表
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* 平台筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">平台:</span>
          <div className="flex gap-2">
            {platforms.map((platform) => (
              <Button
                key={platform.value}
                size="sm"
                variant={selectedPlatform === platform.value ? 'primary' : 'outline'}
                onClick={() => {
                  setSelectedPlatform(platform.value);
                  setPage(1);
                }}
              >
                {platform.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 视图切换 */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            onClick={() => setViewMode('grid')}
          >
            网格
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            列表
          </Button>
        </div>
      </div>

      {/* 商品列表 */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loading size="lg" text="加载商品数据..." />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="📦"
          title="暂无商品"
          description="当前筛选条件下没有找到商品"
          action={{
            label: '重置筛选',
            onClick: () => {
              setSelectedPlatform('all');
              setSortBy('recommendation_score');
              setPage(1);
            },
          }}
        />
      ) : (
        <>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col gap-4'
            }
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>

              <span className="text-sm text-gray-600">
                第 {page} / {totalPages} 页
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {showDeleteConfirm === 'low_score' ? '确认删除低分商品' : '确认清空商品列表'}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {showDeleteConfirm === 'low_score'
                  ? `此操作将删除所有推荐分数低于 ${scoreThreshold} 的商品，删除后无法恢复。`
                  : '此操作将清空所有商品数据，删除后无法恢复。'}
              </p>
              
              {showDeleteConfirm === 'low_score' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      推荐分数阈值：{scoreThreshold} 分
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      step="5"
                      value={scoreThreshold}
                      onChange={(e) => setScoreThreshold(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10 (极低)</span>
                      <span>30 (低)</span>
                      <span>50 (中)</span>
                      <span>70 (高)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-xs text-orange-800">
                      💡 建议：
                      <br />• 10-30分：极低质量商品（市场验证不足）
                      <br />• 30-50分：低潜力商品（竞争激烈或利润低）
                      <br />• 50-70分：中等商品（谨慎考虑）
                    </p>
                  </div>
                </>
              )}
              
              {showDeleteConfirm === 'all' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-800">
                    ⚠️ 警告：此操作将删除所有商品数据，包括趋势历史记录
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={() => handleBulkDelete(showDeleteConfirm === 'all' ? 'delete_all' : 'low_score')}
                disabled={deleting}
                className={
                  showDeleteConfirm === 'all'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }
              >
                {deleting ? '删除中...' : '确认删除'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
