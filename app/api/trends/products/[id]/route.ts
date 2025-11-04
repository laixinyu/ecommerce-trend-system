import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { calculateProfitMargin } from '@/lib/analytics/profit-estimation';
import { generateRecommendationReasons } from '@/lib/analytics/recommendation';
import { transformProduct, transformProducts } from '@/lib/utils/transform';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseClient();

    // 获取商品详情
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(
        `
        *,
        categories (
          id,
          name,
          parent_id
        )
      `
      )
      .eq('id', id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: '商品不存在',
          },
        },
        { status: 404 }
      );
    }

    // 获取趋势历史数据
    const { data: history } = await supabase
      .from('trend_history')
      .select('*')
      .eq('product_id', id)
      .order('date', { ascending: true })
      .limit(90); // 最近90天

    // 获取同类商品
    const categoryId = (product as { category_id?: string }).category_id;
    const { data: similarProducts } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId || '')
      .neq('id', id)
      .limit(10);

    // 转换产品数据格式
    const formattedProduct = transformProduct(product);

    // 计算利润分析（使用转换后的数据）
    const profitAnalysis = formattedProduct ? calculateProfitMargin(formattedProduct) : {
      revenue: 0,
      cost: 0,
      platformFee: 0,
      shippingCost: 0,
      profit: 0,
      profitMargin: 0,
      roi: 0,
    };
    const formattedSimilarProducts = transformProducts(similarProducts || []);

    // 生成推荐理由（在转换后，使用格式化的数据）
    const recommendationReasons = generateRecommendationReasons(
      formattedProduct as any,
      history || [],
      formattedSimilarProducts as any[]
    );

    // 检查是否已收藏
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isFavorite = false;
    if (user) {
      const { data: favorite } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      isFavorite = !!favorite;
    }

    return NextResponse.json({
      success: true,
      data: {
        product: formattedProduct,
        history: history || [],
        similarProducts: formattedSimilarProducts,
        profitAnalysis,
        recommendationReasons,
        isFavorite,
      },
    });
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PRODUCT_DETAIL_ERROR',
          message: '获取商品详情失败',
        },
      },
      { status: 500 }
    );
  }
}
