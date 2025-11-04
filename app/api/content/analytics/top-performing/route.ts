import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContentAnalytics } from '@/lib/content/content-analytics';

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
    const limit = parseInt(searchParams.get('limit') || '10');
    const platform = searchParams.get('platform') || undefined;
    const startDate = searchParams.get('start_date') 
      ? new Date(searchParams.get('start_date')!) 
      : undefined;
    const endDate = searchParams.get('end_date') 
      ? new Date(searchParams.get('end_date')!) 
      : undefined;

    const topContent = await ContentAnalytics.getTopPerformingContent(
      user.id,
      limit,
      platform,
      startDate,
      endDate
    );

    return NextResponse.json({
      content: topContent,
      count: topContent.length,
    });
  } catch (error: any) {
    console.error('Get top performing content error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get top performing content' },
      { status: 500 }
    );
  }
}
