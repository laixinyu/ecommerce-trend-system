import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');

    const supabase = createSupabaseClient();

    // 构建查询
    let query = supabase.from('categories').select('*').order('name');

    if (level !== null) {
      query = query.eq('level', parseInt(level));
    }

    const { data: categories, error } = await query;

    if (error) {
      throw error;
    }

    // 为每个类目获取商品统计
    const categoriesWithStats = await Promise.all(
      (categories || []).map(async (category: any) => {
        // 获取该类目下的商品数量
        // @ts-ignore - Supabase类型生成问题
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);

        // 获取该类目下的平均趋势分数
        // @ts-ignore - Supabase类型生成问题
        const { data: products } = await supabase
          .from('products')
          .select('trend_score, recommendation_score')
          .eq('category_id', category.id);

        const avgTrendScore =
          products && products.length > 0
            ? products.reduce((sum: number, p: any) => sum + (p.trend_score || 0), 0) / products.length
            : 0;

        const avgRecommendationScore =
          products && products.length > 0
            ? products.reduce((sum: number, p: unknown) => sum + (p.recommendation_score || 0), 0) /
            products.length
            : 0;

        return {
          ...category,
          stats: {
            productCount: productCount || 0,
            avgTrendScore: Math.round(avgTrendScore * 100) / 100,
            avgRecommendationScore: Math.round(avgRecommendationScore * 100) / 100,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesWithStats,
      },
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CATEGORIES_ERROR',
          message: '获取类目数据失败',
        },
      },
      { status: 500 }
    );
  }
}
