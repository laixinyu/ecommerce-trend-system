// 客户画像API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rfmAnalysis } from '@/lib/growth/rfm-analysis';
import { Customer } from '@/types/crm';

/**
 * GET /api/growth/customers/[id]/profile
 * 获取客户画像
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: customerId } = await params;

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取客户数据
    const { data: customer, error: customerError } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('id', customerId)
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // 生成客户画像
    const profile = rfmAnalysis.generateCustomerProfile(customer as Customer);

    return NextResponse.json({
      customer,
      profile,
    });
  } catch (error) {
    console.error('Get customer profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get customer profile' },
      { status: 500 }
    );
  }
}
