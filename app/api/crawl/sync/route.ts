/**
 * 爬虫同步状态 API
 * 用于检查是否有新的爬取数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since'); // ISO 时间戳

    const supabase = createSupabaseClient();

    // 获取最新的爬取日志
    let logsQuery = (supabase as any)
      .from('crawl_logs')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (since) {
      logsQuery = logsQuery.gt('created_at', since);
    }

    const { data: logs } = await logsQuery;

    // 获取最近添加的商品数量
    let productsQuery = (supabase as any)
      .from('products')
      .select('id, created_at, platform, name', { count: 'exact' })
      .not('last_crawled_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (since) {
      productsQuery = productsQuery.gt('created_at', since);
    }

    const { data: newProducts, count: newProductsCount } = await productsQuery;

    // 检查是否有新数据
    const hasNewData = (logs && logs.length > 0) || (newProducts && newProducts.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        hasNewData,
        newProductsCount: newProductsCount || 0,
        recentCrawls: logs || [],
        recentProducts: newProducts || [],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sync status API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
