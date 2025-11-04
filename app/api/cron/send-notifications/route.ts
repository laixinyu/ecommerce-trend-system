import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // 验证 cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting notification send...');

    const supabase = createSupabaseClient();
    let notificationsSent = 0;

    // 1. 检测价格变动
    const { data: priceChanges } = await supabase
      .from('price_history')
      .select(`
        product_id,
        price,
        products (
          id,
          name,
          current_price,
          user_favorites (user_id)
        )
      `)
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });

    if (priceChanges) {
      for (const change of priceChanges) {
        const product = change.products as any;
        if (!product) continue;

        // 价格下降超过 10%
        const priceDropPercent = ((product.current_price - change.price) / change.price) * 100;
        
        if (priceDropPercent < -10 && product.user_favorites) {
          const favorites = product.user_favorites as any[];
          for (const fav of favorites) {
            await supabase.from('notifications').insert({
              user_id: fav.user_id,
              type: 'price_alert',
              title: '价格下降提醒',
              message: `${product.name} 价格下降了 ${Math.abs(priceDropPercent).toFixed(1)}%`,
              data: {
                product_id: product.id,
                old_price: change.price,
                new_price: product.current_price,
              },
              created_at: new Date().toISOString(),
            });
            notificationsSent++;
          }
        }
      }
    }

    // 2. 检测新兴趋势
    const { data: trendingProducts } = await supabase
      .from('products')
      .select('id, name, trend_score, platform')
      .gte('trend_score', 80)
      .gte('last_crawled_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (trendingProducts && trendingProducts.length > 0) {
      // 获取所有启用趋势通知的用户
      const { data: users } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('notification_settings->>trendAlert', 'true');

      if (users) {
        for (const user of users) {
          await supabase.from('notifications').insert({
            user_id: user.user_id,
            type: 'trend_alert',
            title: '发现新兴趋势',
            message: `发现 ${trendingProducts.length} 个高趋势分数商品`,
            data: {
              products: trendingProducts.slice(0, 5).map((p) => ({
                id: p.id,
                name: p.name,
                trend_score: p.trend_score,
              })),
            },
            created_at: new Date().toISOString(),
          });
          notificationsSent++;
        }
      }
    }

    console.log(`[CRON] Sent ${notificationsSent} notifications`);

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      data: {
        notificationsSent,
        priceAlerts: priceChanges?.length || 0,
        trendAlerts: trendingProducts?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[CRON] Notification send failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Send failed',
      },
      { status: 500 }
    );
  }
}
