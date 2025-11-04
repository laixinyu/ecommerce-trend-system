// 爬取日志查询API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('crawl_logs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      throw error;
    }

    // 计算统计信息
    const { data: stats } = await supabase
      .from('crawl_logs')
      .select('status, platform')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const statistics = {
      total: count || 0,
      last24h: stats?.length || 0,
      byStatus: {
        completed: stats?.filter((s: any) => s.status === 'completed').length || 0,
        failed: stats?.filter((s: any) => s.status === 'failed').length || 0,
        started: stats?.filter((s: any) => s.status === 'started').length || 0,
      },
      byPlatform: {
        amazon: stats?.filter((s: any) => s.platform === 'amazon').length || 0,
        aliexpress: stats?.filter((s: any) => s.platform === 'aliexpress').length || 0,
        ebay: stats?.filter((s: unknown) => s.platform === 'ebay').length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        logs,
        statistics,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch crawl logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawl logs' },
      { status: 500 }
    );
  }
}
