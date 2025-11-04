import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { realAmazonCrawler } from '@/lib/crawler/real-amazon-crawler';
import { realAliExpressCrawler } from '@/lib/crawler/real-aliexpress-crawler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 使用 service role key 绕过 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // 获取商品信息
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        {
          success: false,
          error: '商品不存在',
        },
        { status: 404 }
      );
    }

    // 根据平台刷新数据
    let updatedData: any = null;

    if (product.platform === 'amazon') {
      // 获取 Amazon 商品详情
      updatedData = await realAmazonCrawler.getProductDetails(product.platform_id);
    } else if (product.platform === 'aliexpress') {
      // AliExpress 暂时不支持单个商品刷新，返回提示
      return NextResponse.json({
        success: false,
        error: 'AliExpress 商品暂不支持单独刷新，请使用批量爬取功能',
      });
    }

    if (!updatedData) {
      return NextResponse.json({
        success: false,
        error: '无法获取商品最新数据',
      });
    }

    // 重新计算评分指标
    const { calculateTrendScore } = await import('@/lib/analytics/trend-scoring');
    const { calculateCompetitionScore } = await import('@/lib/analytics/competition-scoring');
    const { calculateRecommendationScore } = await import('@/lib/analytics/recommendation');

    // 构建临时 Product 对象用于计算评分
    const tempProduct: any = {
      id: product.id,
      name: product.name,
      platform: product.platform,
      currentPrice: updatedData.price || product.current_price,
      averageRating: updatedData.rating || product.average_rating,
      reviewCount: updatedData.reviewCount || product.review_count,
      sellerCount: product.seller_count || 1,
      createdAt: product.created_at,
    };

    // 计算各项指标
    const trendScore = calculateTrendScore(tempProduct, []);
    const competitionScore = calculateCompetitionScore(tempProduct, []);
    const recommendationScore = calculateRecommendationScore(tempProduct, [], []);

    // 更新数据库
    const { error: updateError } = await supabase
      .from('products')
      .update({
        current_price: updatedData.price || product.current_price,
        average_rating: updatedData.rating || product.average_rating,
        review_count: updatedData.reviewCount || product.review_count,
        image_url: updatedData.imageUrl || product.image_url,
        trend_score: trendScore,
        competition_score: competitionScore,
        recommendation_score: recommendationScore,
        last_crawled_at: new Date().toISOString(),
      } as unknown)
      .eq('id', id);

    if (updateError) {
      console.error('更新商品失败:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新商品数据失败',
      });
    }

    return NextResponse.json({
      success: true,
      message: '商品数据已更新',
      data: {
        price: updatedData.price,
        rating: updatedData.rating,
        reviewCount: updatedData.reviewCount,
        trendScore,
        competitionScore,
        recommendationScore,
        lastCrawledAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('刷新商品 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器错误',
      },
      { status: 500 }
    );
  }
}
