import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { transformProducts } from '@/lib/utils/transform';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 筛选参数
    const platform = searchParams.get('platform');
    const categoryId = searchParams.get('categoryId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minTrendScore = searchParams.get('minTrendScore');
    const minRecommendationScore = searchParams.get('minRecommendationScore');

    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'recommendation_score';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = createSupabaseClient();

    // 构建查询 - 只查询真实爬取的数据
    let query = (supabase as unknown).from('products').select(
      `
      *,
      categories (
        id,
        name
      )
    `,
      { count: 'exact' }
    );

    // 只显示真实爬取的数据（有 last_crawled_at 且有 external_url 的数据）
    query = query.not('last_crawled_at', 'is', null);
    query = query.not('external_url', 'is', null);

    // 应用筛选
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (minPrice) {
      query = query.gte('current_price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('current_price', parseFloat(maxPrice));
    }

    if (minTrendScore) {
      query = query.gte('trend_score', parseFloat(minTrendScore));
    }

    if (minRecommendationScore) {
      query = query.gte('recommendation_score', parseFloat(minRecommendationScore));
    }

    // 应用排序
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // 应用分页
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // 转换数据库字段名为前端格式
    const products = transformProducts(data || []);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PRODUCTS_ERROR',
          message: '获取商品列表失败',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
