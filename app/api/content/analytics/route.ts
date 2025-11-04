import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContentSyncService } from '@/lib/integrations/sync/content-sync-service';

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
    const startDate = searchParams.get('start_date') 
      ? new Date(searchParams.get('start_date')!) 
      : undefined;
    const endDate = searchParams.get('end_date') 
      ? new Date(searchParams.get('end_date')!) 
      : undefined;

    // Get aggregated metrics
    const metrics = await ContentSyncService.getAggregatedMetrics(
      user.id,
      startDate,
      endDate
    );

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Get content analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get content analytics' },
      { status: 500 }
    );
  }
}
