import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InventoryManager } from '@/lib/supply-chain/inventory-manager';
import { Logger } from '@/lib/utils/logger';

/**
 * GET /api/supply-chain/inventory/alerts
 * 获取库存预警
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

    const alerts = await InventoryManager.generateInventoryAlerts(user.id);

    return NextResponse.json({ alerts });
  } catch (error) {
    Logger.error('Inventory alerts API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
