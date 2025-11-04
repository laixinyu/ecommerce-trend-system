import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InventoryManager } from '@/lib/supply-chain/inventory-manager';
import { Logger } from '@/lib/utils/logger';

/**
 * GET /api/supply-chain/inventory/metrics
 * 获取库存指标
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await InventoryManager.getInventoryMetrics(user.id);

    return NextResponse.json({ metrics });
  } catch (error) {
    Logger.error('Inventory metrics API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
