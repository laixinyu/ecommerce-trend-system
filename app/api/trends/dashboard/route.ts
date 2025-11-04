import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createSupabaseClient();

    // 获取热门商品数量
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // 获取新兴趋势数量（趋势分数>80的商品）
    const { count: emergingCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .gte('trend_score', 80);

    // 获取用户收藏数量（需要用户认证）
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let favoriteCount = 0;
    if (user) {
      const { count } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      favoriteCount = count || 0;
    }

    // 获取Top 10推荐商品
    const { data: topProducts } = await supabase
      .from('products')
      .select('*')
      .order('recommendation_score', { ascending: false })
      .limit(10);

    // 获取各平台商品数量
    const { data: platformStats } = await supabase
      .from('products')
      .select('platform')
      .order('platform');

    const platformCounts = platformStats?.reduce(
      (acc, item) => {
        acc[item.platform] = (acc[item.platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProducts: productCount || 0,
          emergingTrends: emergingCount || 0,
          favorites: favoriteCount,
        },
        topProducts: topProducts || [],
        platformStats: platformCounts || {},
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: '获取仪表板数据失败',
        },
      },
      { status: 500 }
    );
  }
}
