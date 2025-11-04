import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions, getPopularSearches } from '@/lib/search/autocomplete';
import { optimizeSearchQuery } from '@/lib/search/performance';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includePopular = searchParams.get('includePopular') === 'true';

    // 如果没有查询词，返回热门搜索
    if (!rawQuery || rawQuery.length < 2) {
      if (includePopular) {
        const popular = await getPopularSearches(limit);
        return NextResponse.json({
          query: '',
          suggestions: [],
          popular,
        });
      }
      return NextResponse.json({ suggestions: [] });
    }

    // 优化查询
    const query = optimizeSearchQuery(rawQuery);

    // 获取搜索建议
    const suggestions = await getSearchSuggestions(query, limit);

    // 可选：包含热门搜索
    let popular: string[] = [];
    if (includePopular) {
      popular = await getPopularSearches(5);
    }

    return NextResponse.json({
      query: rawQuery,
      suggestions,
      ...(includePopular && { popular }),
    });
  } catch (error) {
    console.error('获取建议异常:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
