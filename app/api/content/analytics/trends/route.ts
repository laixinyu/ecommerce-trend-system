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
    const platform = searchParams.get('platform') || undefined;
    const days = parseInt(searchParams.get('days') || '30');

    const trends = await ContentAnalytics.getPerformanceTrends(
      user.id,
      platform,
      days
    );

    return NextResponse.json(trends);
  } catch (error: any) {
    console.error('Get performance trends error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get performance trends' },
      { status: 500 }
    );
  }
}
