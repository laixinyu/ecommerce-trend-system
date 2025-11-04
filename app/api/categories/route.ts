import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'amazon';

    // 获取指定平台的分类
    let query = supabase
      .from('categories')
      .select('id, name, parent_id, level, platform')
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    // 如果指定了平台，则过滤
    if (platform && platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data: categories, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: categories || [],
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}
