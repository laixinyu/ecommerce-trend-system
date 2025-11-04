import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transformProducts } from '@/lib/utils/transform';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    const supabase = await createClient();

    // 构建查询
    let queryBuilder = supabase
      .from('products')
      .select('*')
      .order('recommendation_score', { ascending: false });

    // 如果有类目
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data: products, error } = await queryBuilder.limit(limit * 2);

    if (error) {
      console.error('获取推荐错误:', error);
      return NextResponse.json(
        { error: '获取推荐失败' },
        { status: 500 }
      );
    }

    // 转换产品数据
    const transformedProducts = transformProducts(products || []);

    // 按推荐分数排序
    const sortedProducts = transformedProducts.sort(
      (a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0)
    );

    // 取前N个
    const recommendations = sortedProducts.slice(0, limit);

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
      personalized: !!userId,
    });
  } catch (error) {
    console.error('获取推荐异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
