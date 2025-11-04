// RFM分析API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rfmAnalysis } from '@/lib/growth/rfm-analysis';
import { Customer } from '@/types/crm';

/**
 * POST /api/growth/rfm/analyze
 * 执行RFM分析并更新客户分层
 */
export async function POST(request: NextRequest) {
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

    // 获取所有客户数据
    const { data: customers, error: customersError } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('user_id', user.id);

    if (customersError) {
      throw customersError;
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        message: 'No customers to analyze',
        analyzed: 0,
      });
    }

    // 执行RFM分析
    const analyzedCustomers = await rfmAnalysis.analyzeAllCustomers(
      customers as Customer[]
    );

    // 更新客户数据
    let updated = 0;
    for (const customer of analyzedCustomers) {
      const ltv = rfmAnalysis.calculateLTV(customer);

      const { error: updateError } = await supabase
        .from('crm_customers')
        .update({
          rfm_score: customer.rfm_score,
          segment: customer.segment,
          ltv,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (!updateError) {
        updated++;
      }
    }

    // 获取分层统计
    const segmentStats = rfmAnalysis.getSegmentStats(analyzedCustomers);

    return NextResponse.json({
      message: 'RFM analysis completed',
      analyzed: customers.length,
      updated,
      segment_stats: segmentStats,
    });
  } catch (error: any) {
    console.error('RFM analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform RFM analysis' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/growth/rfm/analyze
 * 获取RFM分析统计
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

    // 获取所有客户数据
    const { data: customers, error: customersError } = await supabase
      .from('crm_customers')
      .select('*')
      .eq('user_id', user.id);

    if (customersError) {
      throw customersError;
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        total_customers: 0,
        segment_stats: {},
        avg_ltv: 0,
      });
    }

    // 获取分层统计
    const segmentStats = rfmAnalysis.getSegmentStats(customers as Customer[]);

    // 计算平均LTV
    const avgLTV =
      customers.reduce((sum, c) => sum + (c.ltv || 0), 0) / customers.length;

    return NextResponse.json({
      total_customers: customers.length,
      segment_stats: segmentStats,
      avg_ltv: avgLTV,
    });
  } catch (error: any) {
    console.error('Get RFM stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get RFM statistics' },
      { status: 500 }
    );
  }
}
