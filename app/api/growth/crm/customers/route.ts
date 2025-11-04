// CRM客户数据API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/growth/crm/customers
 * 获取客户列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get('segment');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询
    let query = supabase
      .from('crm_customers')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('last_purchase_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // 按分层筛选
    if (segment) {
      query = query.eq('segment', segment);
    }

    const { data: customers, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      customers: customers || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get customers' },
      { status: 500 }
    );
  }
}
