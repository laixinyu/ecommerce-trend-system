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
    const topN = parseInt(searchParams.get('top_n') || '20');

    const patterns = await ContentAnalytics.identifySuccessPatterns(user.id, topN);

    return NextResponse.json(patterns);
  } catch (error: any) {
    console.error('Identify success patterns error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to identify success patterns' },
      { status: 500 }
    );
  }
}
