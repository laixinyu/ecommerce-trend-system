import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Logger } from '@/lib/utils/logger';

/**
 * GET /api/supply-chain/inventory
 * 获取库存列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const sku = searchParams.get('sku');
    const lowStock = searchParams.get('low_stock') === 'true';

    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 按SKU筛选
    if (sku) {
      query = query.ilike('sku', `%${sku}%`);
    }

    const { data: items, error } = await query;

    if (error) {
      Logger.error('Failed to fetch inventory items', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 如果需要筛选低库存商品
    let filteredItems = items || [];
    if (lowStock && items) {
      filteredItems = items.filter((item: {
        quantity_on_hand: number;
        quantity_in_transit: number;
        reorder_point: number | null;
      }) => {
        const availableStock = item.quantity_on_hand + item.quantity_in_transit;
        const reorderPoint = item.reorder_point || 0;
        return availableStock <= reorderPoint;
      });
    }

    return NextResponse.json({ items: filteredItems });
  } catch (error) {
    Logger.error('Inventory API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supply-chain/inventory
 * 创建库存项
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
      sku,
      product_name,
      quantity_on_hand,
      quantity_in_transit,
      reorder_point,
      reorder_quantity,
      unit_cost,
      warehouse_location,
    } = body;

    if (!sku) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        user_id: user.id,
        sku,
        product_name,
        quantity_on_hand: quantity_on_hand || 0,
        quantity_in_transit: quantity_in_transit || 0,
        reorder_point,
        reorder_quantity,
        unit_cost,
        warehouse_location,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      Logger.error('Failed to create inventory item', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    Logger.info('Created inventory item', { itemId: item?.id, sku });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    Logger.error('Inventory API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
