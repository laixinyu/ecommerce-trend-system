import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyByPlatform, formatCompactNumber } from '@/lib/utils/format';
import { getRecommendationLevel } from '@/lib/analytics/recommendation';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const recommendationLevel = getRecommendationLevel(product.recommendationScore);

  const levelConfig = {
    highly_recommended: { text: '强烈推荐', variant: 'success' as const },
    worth_considering: { text: '值得考虑', variant: 'warning' as const },
    not_recommended: { text: '不推荐', variant: 'danger' as const },
  };

  const config = levelConfig[recommendationLevel];

  // 检查是否是新商品（24小时内创建）
  // 使用简单的字符串比较避免 Date.now() 的纯度问题
  const isNew = useMemo(() => {
    if (!product.createdAt) return false;
    const createdDate = new Date(product.createdAt);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return createdDate > oneDayAgo;
  }, [product.createdAt]);

  return (
    <Link href={`/products/${product.id}`}>
      <Card hover className="h-full transition-transform hover:scale-105">
        <CardContent className="p-4">
          {/* 商品图片 */}
          <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-white border border-gray-200">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-2"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-4xl">📦</span>
              </div>
            )}

            {/* 新商品标签 */}
            {isNew && (
              <div className="absolute left-2 top-2">
                <Badge variant="default" className="bg-red-500 text-white animate-pulse">
                  🆕 新品
                </Badge>
              </div>
            )}

            {/* 推荐标签 */}
            <div className="absolute right-2 top-2">
              <Badge variant={config.variant}>{config.text}</Badge>
            </div>
          </div>

          {/* 商品信息 */}
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
              {product.name}
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">
                {formatCurrencyByPlatform(product.currentPrice, product.platform)}
              </span>
              <Badge variant="default">{product.platform}</Badge>
            </div>

            {/* 评分指标 */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center bg-gray-50 rounded p-2">
                <div className={`font-semibold ${
                  (product.trendScore ?? 0) >= 70 ? 'text-green-600' :
                  (product.trendScore ?? 0) >= 40 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {product.trendScore?.toFixed(0) ?? 'N/A'}
                  <span className="text-gray-400 font-normal">/100</span>
                </div>
                <div className="text-gray-500">趋势</div>
              </div>
              <div className="text-center bg-gray-50 rounded p-2">
                <div className={`font-semibold ${
                  (product.competitionScore ?? 10) <= 3 ? 'text-green-600' :
                  (product.competitionScore ?? 10) <= 7 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {product.competitionScore?.toFixed(1) ?? 'N/A'}
                  <span className="text-gray-400 font-normal">/10</span>
                </div>
                <div className="text-gray-500">竞争</div>
              </div>
              <div className="text-center bg-gray-50 rounded p-2">
                <div className={`font-semibold ${
                  (product.recommendationScore ?? 0) >= 75 ? 'text-green-600' :
                  (product.recommendationScore ?? 0) >= 50 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {product.recommendationScore?.toFixed(0) ?? 'N/A'}
                  <span className="text-gray-400 font-normal">/100</span>
                </div>
                <div className="text-gray-500">推荐</div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-100 p-4">
          <div className="flex w-full items-center justify-between text-xs text-gray-500">
            <span>⭐ {product.averageRating?.toFixed(1) ?? 'N/A'}</span>
            <span>💬 {formatCompactNumber(product.reviewCount ?? 0)}</span>
            <span>🏪 {formatCompactNumber(product.sellerCount ?? 0)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
