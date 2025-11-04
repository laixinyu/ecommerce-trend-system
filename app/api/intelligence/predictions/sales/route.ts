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
    const { product_id, days = 30 } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'Missing required field: product_id' },
        { status: 400 }
      );
    }

    const analytics = new PredictiveAnalytics(supabase, user.id);
    const prediction = await analytics.predictSales(product_id, days);

    return NextResponse.json({ prediction });
  } catch (error: any) {
    console.error('Error predicting sales:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
