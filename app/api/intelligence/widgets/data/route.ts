import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DataAggregator } from '@/lib/intelligence/data-aggregator';
import { DataSource } from '@/types/intelligence';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data_source } = body as { data_source: DataSource };

    if (!data_source || !data_source.module || !data_source.endpoint) {
      return NextResponse.json(
        { error: 'Invalid data source' },
        { status: 400 }
      );
    }

    const data = await DataAggregator.fetchDataFromSource(data_source, user.id);

    // Apply aggregation if specified
    let result = data;
    if (data_source.aggregation && Array.isArray(data)) {
      result = this.applyAggregation(data, data_source.aggregation);
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error fetching widget data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function applyAggregation(data: any[], aggregation: string): number {
  if (data.length === 0) return 0;

  switch (aggregation) {
    case 'count':
      return data.length;
    case 'sum':
      return data.reduce((sum, item) => sum + (item.value || 0), 0);
    case 'avg':
      const sum = data.reduce((sum, item) => sum + (item.value || 0), 0);
      return sum / data.length;
    case 'min':
      return Math.min(...data.map(item => item.value || 0));
    case 'max':
      return Math.max(...data.map(item => item.value || 0));
    default:
      return data.length;
  }
}
