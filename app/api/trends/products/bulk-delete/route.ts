import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function DELETE(request: NextRequest) {
  try {
    const { action, threshold } = await request.json();
    const supabase = createSupabaseClient();

    let deletedCount = 0;

    if (action === 'delete_not_recommended') {
      // 删除不推荐的商品（推荐分数低于阈值）
      const scoreThreshold = threshold || 50; // 默认阈值为 50

      // 先查询要删除的商品数量
      const countQuery = supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('recommendation_score', scoreThreshold);

      const { count } = await countQuery;
      deletedCount = count || 0;

      // 执行删除
      const deleteQuery = supabase
        .from('products')
        .delete()
        .lt('recommendation_score', scoreThreshold);

      const { error } = await deleteQuery;

      if (error) {
        throw error;
      }
    } else if (action === 'delete_all') {
      // 清空所有商品
      // 先查询总数
      const countQuery = supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count } = await countQuery;
      deletedCount = count || 0;

      // 执行删除所有商品
      const deleteQuery = supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录

      const { error } = await deleteQuery;

      if (error) {
        throw error;
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
          action === 'delete_not_recommended'
            ? `已删除 ${deletedCount} 个不推荐的商品`
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
