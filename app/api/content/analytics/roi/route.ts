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
    const { asset_id, ad_spend, revenue } = body;

    if (!asset_id) {
      return NextResponse.json(
        { error: 'asset_id is required' },
        { status: 400 }
      );
    }

    const roi = await ContentAnalytics.calculateContentROI(
      user.id,
      asset_id,
      ad_spend,
      revenue
    );

    return NextResponse.json(roi);
  } catch (error: any) {
    console.error('Calculate content ROI error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate content ROI' },
      { status: 500 }
    );
  }
}
