import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function DELETE(request: NextRequest) {
  try {
    const { action, threshold } = await request.json();
    const supabase = createSupabaseClient();

    console.log('批量删除请求:', { action, threshold });

    let deletedCount = 0;

    if (action === 'delete_low_score') {
      // 删除低分商品（推荐分数低于阈值）
      const scoreThreshold = threshold || 30; // 默认阈值为 30

      // 先查询要删除的商品 ID
      const { data: productsToDelete, error: queryError } = await supabase
        .from('products')
        .select('id, recommendation_score')
        .lt('recommendation_score', scoreThreshold);

      if (queryError) {
        console.error('查询商品失败:', queryError);
        throw queryError;
      }

      deletedCount = productsToDelete?.length || 0;
      console.log(`找到 ${deletedCount} 个推荐分数 < ${scoreThreshold} 的商品`);

      // 如果有商品需要删除，执行删除
      if (deletedCount > 0) {
        const { error: deleteError, count } = await supabase
          .from('products')
          .delete({ count: 'exact' })
          .lt('recommendation_score', scoreThreshold);

        if (deleteError) {
          console.error('删除商品失败:', deleteError);
          throw deleteError;
        }

        console.log(`成功删除 ${count || deletedCount} 个商品`);
      }
    } else if (action === 'delete_all') {
      // 清空所有商品
      // 先查询所有商品 ID
      const { data: allProducts, error: queryError } = await supabase
        .from('products')
        .select('id');

      if (queryError) {
        console.error('查询所有商品失败:', queryError);
        throw queryError;
      }

      deletedCount = allProducts?.length || 0;
      console.log(`找到 ${deletedCount} 个商品，准备删除`);

      // 如果有商品，执行删除
      if (deletedCount > 0 && allProducts) {
        // 提取所有商品 ID
        const productIds = allProducts.map((p: { id: string }) => p.id);
        console.log(`商品 ID 列表:`, productIds.slice(0, 5), '...');

        // 使用 in 操作符删除所有商品
        const { error: deleteError, count } = await supabase
          .from('products')
          .delete({ count: 'exact' })
          .in('id', productIds);

        if (deleteError) {
          console.error('删除所有商品失败:', deleteError);
          throw deleteError;
        }

        console.log(`成功删除 ${count || deletedCount} 个商品`);
        deletedCount = count || deletedCount;
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: '无效的操作类型',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        message:
          action === 'delete_low_score'
            ? `已删除 ${deletedCount} 个低分商品（推荐分数 < ${threshold || 30}）`
            : `已清空所有商品，共删除 ${deletedCount} 个商品`,
      },
    });
  } catch (error) {
    console.error('Bulk delete products error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BULK_DELETE_ERROR',
          message: '批量删除商品失败',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
