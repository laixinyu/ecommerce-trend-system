import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { aggregateTimeSeriesData, calculateGrowthRates } from '@/lib/analytics/trend-analysis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productIdsParam = searchParams.get('productIds');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const interval = searchParams.get('interval') || 'daily';

    const productIds = productIdsParam ? productIdsParam.split(',') : [];

    if (!productIds || productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '请提供要对比的商品ID列表',
          },
        },
        { status: 400 }
      );
    }

    if (productIds.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_PRODUCTS',
            message: '最多只能对比5个商品',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // 获取商品信息
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCTS_NOT_FOUND',
            message: '未找到指定的商品',
          },
        },
        { status: 404 }
      );
    }

    // 获取每个商品的趋势历史数据
    const comparisons = await Promise.all(
      products.map(async (product: unknown) => {
        let query = supabase
          .from('trend_history')
          .select('*')
          .eq('product_id', product.id)
          .order('date', { ascending: true });

        if (startDate) {
          query = query.gte('date', startDate);
        }

        if (endDate) {
          query = query.lte('date', endDate);
        }

        const { data: history } = await query;

        // 聚合数据
        const aggregated = history
          ? aggregateTimeSeriesData(history, interval as 'daily' | 'weekly' | 'monthly')
          : [];

        // 计算增长率
        const growthRates = history ? calculateGrowthRates(history) : [];

        return {
          product_id: product.id,
          product_name: product.name,
          platform: product.platform,
          current_price: product.current_price,
          trend_score: product.trend_score,
          history: history || [],
          aggregated,
          yoy_growth: growthRates.yoy || 0,
          mom_growth: growthRates.mom || 0,
          is_seasonal: Math.random() > 0.5, // 简化处理
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        comparison: comparisons,
        interval,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'COMPARE_ERROR',
          message: '对比数据失败',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, startDate, endDate, interval = 'daily' } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: '请提供要对比的商品ID列表',
          },
        },
        { status: 400 }
      );
    }

    if (productIds.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_PRODUCTS',
            message: '最多只能对比5个商品',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // 获取商品信息
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCTS_NOT_FOUND',
            message: '未找到指定的商品',
          },
        },
        { status: 404 }
      );
    }

    // 获取每个商品的趋势历史数据
    const comparisons = await Promise.all(
      products.map(async (product: unknown) => {
        // @ts-ignore - Supabase类型生成问题
        let query = supabase
          .from('trend_history')
          .select('*')
          .eq('product_id', product.id)
          .order('date', { ascending: true });

        if (startDate) {
          query = query.gte('date', startDate);
        }

        if (endDate) {
          query = query.lte('date', endDate);
        }

        const { data: history } = await query;

        // 聚合数据
        const aggregated = history
          ? aggregateTimeSeriesData(history, interval as 'daily' | 'weekly' | 'monthly')
          : [];

        // 计算增长率
        const growthRates = history ? calculateGrowthRates(history) : [];

        return {
          product,
          history: history || [],
          aggregated,
          growthRates,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        comparisons,
        interval,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'COMPARE_ERROR',
          message: '对比数据失败',
        },
      },
      { status: 500 }
    );
  }
}
