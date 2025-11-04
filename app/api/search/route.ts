import { NextRequest, NextResponse } from 'next/server';
import { fuzzySearch } from '@/lib/search/full-text-search';
import { rankSearchResults } from '@/lib/search/ranking';
import { SearchCache, optimizeSearchQuery, SearchPerformanceMonitor } from '@/lib/search/performance';
import { trackSearch } from '@/lib/search/autocomplete';
import { transformProducts } from '@/lib/utils/transform';

export async function GET(request: NextRequest) {
  const timer = SearchPerformanceMonitor.startTimer();

  try {
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q');
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!rawQuery) {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      );
    }

    // 优化查询
    const query = optimizeSearchQuery(rawQuery);

    // 构建筛选条件
    const filters: Record<string, string> = {};
    if (platform) filters.platform = platform;
    if (category) filters.category = category;

    // 检查缓存
    const cached = SearchCache.get(query, filters);

    if (cached) {
      return NextResponse.json(cached);
    }

    // 执行搜索
    const searchResult = await fuzzySearch({
      query,
      limit,
      offset,
      filters,
    });

    // 转换产品数据
    const transformedResults = transformProducts(searchResult.results);

    // 对结果进行排序优化
    const rankedResults = rankSearchResults(transformedResults as never[], query);

    const response = {
      query: rawQuery,
      optimizedQuery: query,
      results: rankedResults,
      total: searchResult.total,
      count: rankedResults.length,
      limit,
      offset,
    };

    // 缓存结果
    SearchCache.set(query, filters, response);

    // 记录搜索性能
    const duration = timer();
    SearchPerformanceMonitor.recordSearch(query, duration, rankedResults.length);

    // 异步记录搜索统计
    trackSearch(query, rankedResults.length).catch(console.error);

    return NextResponse.json(response);
  } catch (error) {
    console.error('搜索异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
