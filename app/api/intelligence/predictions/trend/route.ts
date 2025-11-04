import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalytics } from '@/lib/intelligence/predictive-analytics';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, days = 30 } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'Missing required field: category' },
        { status: 400 }
      );
    }

    const analytics = new PredictiveAnalytics(supabase, user.id);
    const prediction = await analytics.predictTrend(category, days);

    return NextResponse.json({ prediction });
  } catch (error: any) {
    console.error('Error predicting trend:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
