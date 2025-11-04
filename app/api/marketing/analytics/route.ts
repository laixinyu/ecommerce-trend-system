// 营销分析API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { marketingAnalytics } from '@/lib/analytics/marketing-analytics';

/**
 * GET /api/marketing/analytics
 * 获取营销分析数据
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

    // 查询参数
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('type'); // roas, funnel, comparison, top_performers, spend_trend
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let data;

    switch (analysisType) {
      case 'roas':
        // 跨平台ROAS分析
        const dateRange =
          startDate && endDate ? { startDate, endDate } : undefined;
        data = await marketingAnalytics.calculateCrossPlatformROAS(
          user.id,
          dateRange
        );
        break;

      case 'platform_summary':
        // 平台汇总ROAS
        data = await marketingAnalytics.getPlatformROASSummary(user.id);
        break;

      case 'funnel':
        // 转化漏斗分析
        // 这里需要从请求中获取漏斗数据
        const visitors = parseInt(searchParams.get('visitors') || '0');
        const productViews = parseInt(searchParams.get('product_views') || '0');
        const addToCarts = parseInt(searchParams.get('add_to_carts') || '0');
        const checkouts = parseInt(searchParams.get('checkouts') || '0');
        const purchases = parseInt(searchParams.get('purchases') || '0');

        data = marketingAnalytics.analyzeConversionFunnel({
          visitors,
          productViews,
          addToCarts,
          checkouts,
          purchases,
        });
        break;

      case 'comparison':
        // 广告活动对比
        const campaignIds = searchParams.get('campaign_ids')?.split(',');
        data = await marketingAnalytics.compareCampaigns(user.id, campaignIds);
        break;

      case 'top_performers':
        // 最佳表现广告
        const metric = (searchParams.get('metric') ||
          'roas') as 'roas' | 'ctr' | 'conversion_rate';
        const limit = parseInt(searchParams.get('limit') || '10');
        data = await marketingAnalytics.identifyTopPerformingAds(
          user.id,
          metric,
          limit
        );
        break;

      case 'spend_trend':
        // 支出趋势
        const days = parseInt(searchParams.get('days') || '30');
        data = await marketingAnalytics.calculateSpendTrend(user.id, days);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      type: analysisType,
      data,
    });
  } catch (error) {
    console.error('Error in GET /api/marketing/analytics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
