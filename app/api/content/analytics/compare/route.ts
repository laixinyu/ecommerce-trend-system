import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContentAnalytics } from '@/lib/content/content-analytics';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { asset_id, competitor_data } = body;

    if (!asset_id) {
      return NextResponse.json(
        { error: 'asset_id is required' },
        { status: 400 }
      );
    }

    const comparison = await ContentAnalytics.compareWithCompetitors(
      user.id,
      asset_id,
      competitor_data
    );

    return NextResponse.json(comparison);
  } catch (error: any) {
    console.error('Compare with competitors error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compare with competitors' },
      { status: 500 }
    );
  }
}
