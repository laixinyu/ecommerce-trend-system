import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ModuleManager } from '@/lib/modules/module-manager';

// GET /api/modules/status - Get status of all modules
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statuses = await ModuleManager.getAllModuleStatuses(user.id);

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error fetching module statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module statuses' },
      { status: 500 }
    );
  }
}
