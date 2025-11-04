import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('content_assets')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: assets, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      assets: assets || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get content assets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get content assets' },
      { status: 500 }
    );
  }
}
