import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createSupabaseClient();

    // 获取所有关键词
    const { data: keywords, error } = await supabase
      .from('keywords')
      .select('id, keyword, search_volume, competition_level, category_id')
      .order('search_volume', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: keywords || [],
    });
  } catch (error) {
    console.error('Get keywords error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch keywords',
      },
      { status: 500 }
    );
  }
}
