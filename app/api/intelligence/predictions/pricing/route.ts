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
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'Missing required field: product_id' },
        { status: 400 }
      );
    }

    const analytics = new PredictiveAnalytics(supabase, user.id);
    const suggestion = await analytics.suggestOptimalPrice(product_id);

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error('Error suggesting pricing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
