import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SearchPerformanceMonitor } from '@/lib/search/performance';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户（需要管理员权限）
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    // 获取搜索统计
    const { data: analytics, error } = await supabase
      .from('search_analytics')
      .select('*')
      .gte(
        'searched_at',
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      )
      .order('searched_at', { ascending: false });

    if (error) {
      console.error('获取搜索分析错误:', error);
      return NextResponse.json(
        { error: '获取分析数据失败' },
        { status: 500 }
      );
    }

    // 统计数据
    const totalSearches = analytics?.length || 0;
    const uniqueQueries = new Set(analytics?.map((a: any) => a.query)).size;
    const avgResultCount =
      analytics?.reduce((sum: number, a: any) => sum + (a.result_count || 0), 0) / totalSearches || 0;

    // 热门搜索词
    const queryFrequency: Record<string, number> = {};
    analytics?.forEach((a: any) => {
      queryFrequency[a.query] = (queryFrequency[a.query] || 0) + 1;
    });

    const topQueries = Object.entries(queryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // 零结果搜索
    const zeroResultSearches = analytics?.filter((a: unknown) => a.result_count === 0).length || 0;

    // 性能指标
    const performanceMetrics = SearchPerformanceMonitor.getMetrics();

    return NextResponse.json({
      period: `${days} days`,
      summary: {
        totalSearches,
        uniqueQueries,
        avgResultCount: avgResultCount.toFixed(2),
        zeroResultSearches,
        zeroResultRate: ((zeroResultSearches / totalSearches) * 100).toFixed(2) + '%',
      },
      topQueries,
      performance: performanceMetrics,
    });
  } catch (error) {
    console.error('搜索分析异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
