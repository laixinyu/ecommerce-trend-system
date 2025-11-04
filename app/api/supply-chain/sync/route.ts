import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupplyChainSyncService } from '@/lib/integrations/sync/supply-chain-sync-service';
import { Logger } from '@/lib/utils/logger';

/**
 * POST /api/supply-chain/sync
 * 同步供应链数据
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
    const { sync_type = 'all' } = body; // 'all', 'orders', 'inventory', 'tracking'

    Logger.info('Starting supply chain sync', { userId: user.id, syncType: sync_type });

    if (sync_type === 'all') {
      const result = await SupplyChainSyncService.syncAll(user.id);
      return NextResponse.json({
        message: 'Supply chain data synced successfully',
        ...result,
      });
    }

    // 获取相关集成
    const { data: integrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_type', 'supply_chain')
      .eq('status', 'active');

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { error: 'No active supply chain integrations found' },
        { status: 404 }
      );
    }

    let syncedCount = 0;

    for (const integration of integrations) {
      if (sync_type === 'orders' && integration.service_name === 'shopify') {
        syncedCount += await SupplyChainSyncService.syncShopifyOrders(integration);
      } else if (sync_type === 'inventory' && integration.service_name === 'shopify') {
        syncedCount += await SupplyChainSyncService.syncShopifyInventory(integration);
      } else if (sync_type === 'tracking') {
        if (integration.service_name === '17track') {
          // 获取所有需要追踪的订单
          const { data: orders } = await supabase
            .from('orders')
            .select('shipping_info')
            .eq('user_id', user.id)
            .not('shipping_info', 'is', null);

          if (orders) {
            const trackingNumbers = orders
              .map((o) => (o.shipping_info as { tracking_number?: string })?.tracking_number)
              .filter(Boolean) as string[];

            if (trackingNumbers.length > 0) {
              syncedCount += await SupplyChainSyncService.updateTrackingInfo17track(
                integration,
                trackingNumbers
              );
            }
          }
        } else if (integration.service_name === 'shipstation') {
          syncedCount += await SupplyChainSyncService.updateTrackingInfoShipStation(
            integration
          );
        }
      }
    }

    return NextResponse.json({
      message: `${sync_type} data synced successfully`,
      synced_count: syncedCount,
    });
  } catch (error) {
    Logger.error('Supply chain sync API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
