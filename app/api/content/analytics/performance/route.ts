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
    const assetId = searchParams.get('asset_id');

    if (!assetId) {
      return NextResponse.json(
        { error: 'asset_id is required' },
        { status: 400 }
      );
    }

    const analysis = await ContentAnalytics.analyzeContent(assetId, user.id);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Content performance analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze content performance' },
      { status: 500 }
    );
  }
}
