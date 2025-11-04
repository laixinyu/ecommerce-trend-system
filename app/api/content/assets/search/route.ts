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
    const query = searchParams.get('q');
    const tags = searchParams.get('tags')?.split(',').filter(t => t.trim());
    const platform = searchParams.get('platform');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let dbQuery = supabase
      .from('content_assets')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Text search in title and description
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      dbQuery = dbQuery.overlaps('tags', tags);
    }

    // Filter by platform
    if (platform) {
      dbQuery = dbQuery.eq('platform', platform);
    }

    // Filter by type
    if (type) {
      dbQuery = dbQuery.eq('type', type);
    }

    const { data: assets, error, count } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({
      assets: assets || [],
      total: count || 0,
      limit,
      offset,
      query: {
        q: query,
        tags,
        platform,
        type,
      },
    });
  } catch (error: any) {
    console.error('Search content assets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search content assets' },
      { status: 500 }
    );
  }
}
