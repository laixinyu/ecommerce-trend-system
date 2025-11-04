// 广告活动数据API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/marketing/campaigns
 * 获取广告活动列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 查询参数
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const integrationId = searchParams.get('integration_id');

    // 构建查询
    let query = supabase
      .from('ad_campaigns')
      .select(
        `
        *,
        integrations!inner(
          id,
          user_id,
          service_name,
          service_type
        )
      `
      )
      .eq('integrations.user_id', user.id)
      .order('updated_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaigns: data });
  } catch (error) {
    console.error('Unexpected error in GET /api/marketing/campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
