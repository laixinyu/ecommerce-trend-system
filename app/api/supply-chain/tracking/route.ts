import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Track17Client } from '@/lib/integrations/clients/17track-client';
import { Logger } from '@/lib/utils/logger';
import type { ShippingInfo } from '@/types/supply-chain';

/**
 * GET /api/supply-chain/tracking
 * 获取物流追踪信息
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

    const searchParams = request.nextUrl.searchParams;
    const trackingNumber = searchParams.get('tracking_number');

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      );
    }

    // 查找17track集成
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_name', '17track')
      .eq('status', 'active')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: '17track integration not found' },
        { status: 404 }
      );
    }

    const credentials = (integration as unknown as { credentials: { api_key: string } }).credentials;
    const track17Client = new Track17Client({
      api_key: credentials.api_key,
    });

    const trackingInfo = await track17Client.getSingleTracking(trackingNumber);

    if (!trackingInfo) {
      return NextResponse.json(
        { error: 'Tracking information not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tracking_info: trackingInfo });
  } catch (error) {
    Logger.error('Tracking API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supply-chain/tracking
 * 批量更新物流追踪信息
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
    const { tracking_numbers } = body;

    if (!tracking_numbers || !Array.isArray(tracking_numbers)) {
      return NextResponse.json(
        { error: 'Tracking numbers array is required' },
        { status: 400 }
      );
    }

    // 查找17track集成
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_name', '17track')
      .eq('status', 'active')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: '17track integration not found' },
        { status: 404 }
      );
    }

    const credentials = (integration as unknown as { credentials: { api_key: string } }).credentials;
    const track17Client = new Track17Client({
      api_key: credentials.api_key,
    });

    const trackingInfoList = await track17Client.batchUpdateTracking(tracking_numbers);

    // 更新订单的物流信息
    let updatedCount = 0;

    for (const trackingInfo of trackingInfoList) {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .not('shipping_info', 'is', null);

      if (!orders) continue;

      for (const order of orders) {
        const orderData = order as unknown as {
          id: string;
          shipping_info: ShippingInfo;
        };
        const shippingInfo = orderData.shipping_info;
        if (shippingInfo?.tracking_number === trackingInfo.tracking_number) {
          const updatedShippingInfo: ShippingInfo = {
            ...shippingInfo,
            status: trackingInfo.status,
            estimated_delivery: trackingInfo.estimated_delivery,
          };

          await supabase
            .from('orders')
            .update({
              shipping_info: updatedShippingInfo as unknown as Record<string, unknown>,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderData.id);

          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      message: 'Tracking information updated successfully',
      updated_count: updatedCount,
      tracking_info: trackingInfoList,
    });
  } catch (error) {
    Logger.error('Tracking update API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
