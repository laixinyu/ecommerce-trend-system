'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { ProductCard } from '@/components/features/product-card';
import { formatCurrencyByPlatform, formatCompactNumber } from '@/lib/utils/format';
import { getRecommendationLevel } from '@/lib/analytics/recommendation';
import type { Product, TrendHistory } from '@/types';

interface ProductDetailData {
  product: Product;
  history: TrendHistory[];
  similarProducts: Product[];
  profitAnalysis: {
    revenue: number;
    cost: number;
    platformFee: number;
    shippingCost: number;
    profit: number;
    profitMargin: number;
    roi: number;
  };
  recommendationReasons: string[];
  isFavorite: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const [data, setData] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchProductDetail(params.id as string);
    }
  }, [params.id]);

  const fetchProductDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/trends/products/${id}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setIsFavorite(result.data.isFavorite);
      }
    } catch (error) {
      console.error('Failed to fetch product detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    try {
      if (isFavorite) {
        // 取消收藏
        const response = await fetch(`/api/user/favorites?product_id=${product.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavorite(false);
          setShowCopiedToast(true);
          setTimeout(() => setShowCopiedToast(false), 2000);
        } else {
          const result = await response.json();
          alert(result.error || '取消收藏失败');
        }
      } else {
        // 添加收藏
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: product.id,
          }),
        });

        if (response.ok) {
          setIsFavorite(true);
          setShowCopiedToast(true);
          setTimeout(() => setShowCopiedToast(false), 2000);
        } else {
          const result = await response.json();
          if (response.status === 401) {
            alert('请先登录');
          } else {
            alert(result.error || '添加收藏失败');
          }
        }
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      alert('操作失败，请重试');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share && product) {
      navigator.share({
        title: product.name,
        text: `查看这个商品：${product.name}`,
        url: window.location.href,
      }).catch(() => {
        // 如果分享失败，复制链接
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  const handleRefreshProduct = async () => {
    if (!product || refreshing) return;

    setRefreshing(true);
    setToastMessage('');

    try {
      // 调用刷新 API
      const response = await fetch(`/api/products/${product.id}/refresh`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        // 重新获取商品详情
        await fetchProductDetail(product.id);
        setToastMessage('✅ 商品数据已更新');
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 3000);
      } else {
        setToastMessage('❌ ' + (result.error || '刷新失败'));
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 3000);
      }
    } catch (error) {
      console.error('刷新商品失败:', error);
      setToastMessage('❌ 刷新失败，请重试');
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loading size="lg" text="加载商品详情..." />
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="text-center">
          <p className="text-gray-600">商品不存在</p>
          <Link href="/products">
            <Button className="mt-4">返回商品列表</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  const { product, profitAnalysis, recommendationReasons, similarProducts } = data;
  const recommendationLevel = getRecommendationLevel(product.recommendationScore);

  const levelConfig = {
    highly_recommended: { text: '强烈推荐', variant: 'success' as const },
    worth_considering: { text: '值得考虑', variant: 'warning' as const },
    not_recommended: { text: '不推荐', variant: 'danger' as const },
  };

  const config = levelConfig[recommendationLevel];

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* 页面操作栏 */}
        <div className="flex items-center justify-between">
          <Link href="/products">
            <Button variant="outline" size="sm">
              ← 返回列表
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshProduct}
            disabled={refreshing}
          >
            {refreshing ? '🔄 刷新中...' : '🔄 刷新数据'}
          </Button>
        </div>

        {/* 商品基本信息 */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 商品图片 */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white border border-gray-200">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
              </div>

              {/* 商品信息 */}
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="default">{product.platform}</Badge>
                    <Badge variant={config.variant}>{config.text}</Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                </div>

                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrencyByPlatform(product.currentPrice, product.platform)}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <div className="text-2xl font-bold text-gray-900">
                      {product.trendScore.toFixed(0)}
                      <span className="text-sm text-gray-500 font-normal">/100</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">趋势分数</div>
                    <div className={`text-xs font-medium ${
                      product.trendScore >= 70 ? 'text-green-600' :
                      product.trendScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.trendScore >= 70 ? '🔥 热门' :
                       product.trendScore >= 40 ? '📈 上升' : '📉 冷门'}
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <div className="text-2xl font-bold text-gray-900">
                      {product.competitionScore.toFixed(1)}
                      <span className="text-sm text-gray-500 font-normal">/10</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">竞争度</div>
                    <div className={`text-xs font-medium ${
                      product.competitionScore <= 3 ? 'text-green-600' :
                      product.competitionScore <= 7 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.competitionScore <= 3 ? '🟢 低' :
                       product.competitionScore <= 7 ? '🟡 中' : '🔴 高'}
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <div className="text-2xl font-bold text-gray-900">
                      {product.recommendationScore.toFixed(0)}
                      <span className="text-sm text-gray-500 font-normal">/100</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">推荐评分</div>
                    <div className={`text-xs font-medium ${
                      product.recommendationScore >= 75 ? 'text-green-600' :
                      product.recommendationScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.recommendationScore >= 75 ? '⭐ 强推' :
                       product.recommendationScore >= 50 ? '👍 可考虑' : '⚠️ 不推荐'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>⭐ {product.averageRating.toFixed(1)}</span>
                  <span>💬 {formatCompactNumber(product.reviewCount)} 评论</span>
                  <span>🏪 {formatCompactNumber(product.sellerCount)} 卖家</span>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant={isFavorite ? 'primary' : 'outline'}
                      onClick={handleToggleFavorite}
                    >
                      {isFavorite ? '❤️ 已收藏' : '🤍 添加到收藏'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = product.externalUrl || product.productUrl;
                        if (url) {
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      disabled={!product.externalUrl && !product.productUrl}
                    >
                      查看原商品 🔗
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCopyLink}
                    >
                      📋 复制链接
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleShare}
                    >
                      📤 分享
                    </Button>
                  </div>
                </div>

                {/* 操作成功提示 */}
                {showCopiedToast && (
                  <div className={`rounded-lg border px-3 py-2 text-sm animate-fade-in ${toastMessage.includes('❌')
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                    {toastMessage || (isFavorite ? '✅ 已添加到收藏' : '✅ 操作成功')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品详细信息 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 推荐理由 */}
          <Card>
            <CardHeader>
              <CardTitle>💡 推荐理由</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendationReasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 市场数据 */}
          <Card>
            <CardHeader>
              <CardTitle>📊 市场数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">平均评分</span>
                  <span className="font-semibold">
                    ⭐ {product.averageRating.toFixed(1)} / 5.0
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">评论数量</span>
                  <span className="font-semibold">
                    💬 {formatCompactNumber(product.reviewCount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">卖家数量</span>
                  <span className="font-semibold">
                    🏪 {formatCompactNumber(product.sellerCount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">竞争程度</span>
                  <span className="font-semibold">
                    {product.competitionScore < 3 ? '🟢 低' :
                      product.competitionScore < 7 ? '🟡 中' : '🔴 高'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最后更新</span>
                  <span className="text-sm text-gray-500">
                    {product.lastCrawledAt ?
                      new Date(product.lastCrawledAt).toLocaleDateString('zh-CN') :
                      '未知'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 利润分析 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>💰 利润分析（估算）</CardTitle>
              <Badge variant="warning" className="text-xs">
                仅供参考
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* 提示信息 */}
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
              💡 以下数据基于市场平均水平估算，实际利润会因采购渠道、运营成本等因素而异
            </div>

            {/* 核心指标 */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">售价</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrencyByPlatform(profitAnalysis.revenue, product.platform)}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">估算成本</div>
                <div className="text-lg font-bold text-orange-600">
                  {formatCurrencyByPlatform(profitAnalysis.cost, product.platform)}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-xs text-gray-500 mb-1">预估利润</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrencyByPlatform(profitAnalysis.profit, product.platform)}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <div className="text-xs text-gray-500 mb-1">利润率</div>
                <div className="text-lg font-bold text-green-600">
                  {profitAnalysis.profitMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 成本明细 */}
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm font-medium text-gray-700 mb-3">成本明细</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    平台费用 ({product.platform === 'amazon' ? '15%' :
                      product.platform === 'aliexpress' ? '8%' : '10%'})
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrencyByPlatform(profitAnalysis.platformFee, product.platform)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">物流成本（估算）</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrencyByPlatform(profitAnalysis.shippingCost, product.platform)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="text-gray-600">投资回报率 (ROI)</span>
                  <span className="font-semibold text-blue-600">
                    {profitAnalysis.roi.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 利润评估 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">利润空间评估：</span>
                {profitAnalysis.profitMargin >= 30 ? (
                  <Badge variant="success">🟢 优秀 (≥30%)</Badge>
                ) : profitAnalysis.profitMargin >= 20 ? (
                  <Badge variant="warning">🟡 良好 (20-30%)</Badge>
                ) : profitAnalysis.profitMargin >= 10 ? (
                  <Badge variant="warning">🟠 一般 (10-20%)</Badge>
                ) : (
                  <Badge variant="danger">🔴 较低 (&lt;10%)</Badge>
                )}
              </div>
              {profitAnalysis.profitMargin < 20 && (
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ 建议寻找更优质的供应商或提高售价以获得更好的利润空间
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 相似商品 */}
        {similarProducts.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">相似商品</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
