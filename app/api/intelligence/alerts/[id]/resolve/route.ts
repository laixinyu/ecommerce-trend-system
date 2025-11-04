import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AlertMonitor } from '@/lib/intelligence/alert-monitor';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const monitor = new AlertMonitor(supabase, user.id);
    await monitor.resolveAlert(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
