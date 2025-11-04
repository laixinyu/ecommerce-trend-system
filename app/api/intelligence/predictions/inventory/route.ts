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
    const { sku, days = 30 } = body;

    if (!sku) {
      return NextResponse.json(
        { error: 'Missing required field: sku' },
        { status: 400 }
      );
    }

    const analytics = new PredictiveAnalytics(supabase, user.id);
    const forecast = await analytics.forecastInventoryDemand(sku, days);

    return NextResponse.json({ forecast });
  } catch (error: any) {
    console.error('Error forecasting inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
