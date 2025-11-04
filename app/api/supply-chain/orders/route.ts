import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Logger } from '@/lib/utils/logger';

/**
 * GET /api/supply-chain/orders
 * 获取订单列表
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

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 按状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    // 按平台筛选
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: orders, error } = await query;

    if (error) {
      Logger.error('Failed to fetch orders', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    Logger.error('Orders API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supply-chain/orders
 * 创建订单
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
    const {
      external_order_id,
      platform,
      status,
      items,
      total_amount,
      shipping_info,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        external_order_id,
        platform,
        status: status || 'pending',
        items,
        total_amount,
        shipping_info,
      })
      .select()
      .single();

    if (error) {
      Logger.error('Failed to create order', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    Logger.info('Created order', { orderId: order.id });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    Logger.error('Orders API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
