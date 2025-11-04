import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 这个API Route可以被Vercel Cron或其他定时任务调用
export async function GET(request: NextRequest) {
  try {
    // 验证请求来源（生产环境应该使用密钥验证）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 获取最近24小时内趋势分数显著增长的商品
    const { data: emergingProducts, error } = await supabase
      .from('products')
      .select('*')
      .gte('trend_score', 75)
      .order('trend_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('检测新兴趋势错误:', error);
      return NextResponse.json(
        { error: '检测失败' },
        { status: 500 }
      );
    }

    // 获取所有启用通知的用户
    const { data: users, error: usersError } = await supabase
      .from('notification_preferences')
      .select('user_id, watched_categories, trend_threshold')
      .eq('email_enabled', true);

    if (usersError) {
      console.error('获取用户错误:', usersError);
      return NextResponse.json(
        { error: '获取用户失败' },
        { status: 500 }
      );
    }

    let notificationsSent = 0;

    // 为每个用户创建相关通知
    for (const user of users || []) {
      for (const product of emergingProducts || []) {
        // 检查商品是否符合用户的关注条件
        const matchesCategory =
          !user.watched_categories ||
          user.watched_categories.length === 0 ||
          user.watched_categories.includes(product.category);

        const meetsThreshold =
          !user.trend_threshold || product.trend_score >= user.trend_threshold;

        if (matchesCategory && meetsThreshold) {
          // 创建通知
          await supabase.from('notifications').insert({
            user_id: user.user_id,
            type: 'info',
            title: '发现新兴趋势商品',
            message: `${product.name} 的趋势分数达到 ${product.trend_score}，可能是一个不错的机会！`,
            read: false,
          });

          notificationsSent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      emergingProductsCount: emergingProducts?.length || 0,
      notificationsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('检测新兴趋势异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
