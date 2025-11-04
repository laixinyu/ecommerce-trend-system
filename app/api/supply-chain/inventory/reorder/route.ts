import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InventoryManager } from '@/lib/supply-chain/inventory-manager';
import { Logger } from '@/lib/utils/logger';

/**
 * POST /api/supply-chain/inventory/reorder
 * 批量更新再订购点
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lead_time_days = 14 } = body;

    const updatedCount = await InventoryManager.batchUpdateReorderPoints(
      user.id,
      lead_time_days
    );

    return NextResponse.json({
      message: 'Reorder points updated successfully',
      updated_count: updatedCount,
    });
  } catch (error) {
    Logger.error('Reorder points update API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
