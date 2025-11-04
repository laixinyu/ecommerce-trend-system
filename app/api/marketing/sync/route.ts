// 营销数据同步API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { marketingSyncService } from '@/lib/integrations/sync/marketing-sync-service';

/**
 * POST /api/marketing/sync
 * 手动触发营销数据同步
 */
export async function POST(request: NextRequest) {
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

    // 解析请求体
    const body = await request.json();
    const { integration_id, service_name } = body;

    // 如果指定了集成ID，只同步该集成
    if (integration_id) {
      // 验证集成属于当前用户
      const { data: integration, error: fetchError } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integration_id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !integration) {
        return NextResponse.json(
          { error: 'Integration not found' },
          { status: 404 }
        );
      }

      // 根据服务类型同步
      let result;
      if (integration.service_name === 'meta_ads') {
        const config = integration.config as { ad_account_id?: string };
        if (!config.ad_account_id) {
          return NextResponse.json(
            { error: 'Ad account ID not configured' },
            { status: 400 }
          );
        }
        result = await marketingSyncService.syncMetaAds(
          integration_id,
          user.id,
          config.ad_account_id
        );
      } else if (integration.service_name === 'google_ads') {
        const config = integration.config as { customer_id?: string };
        if (!config.customer_id) {
          return NextResponse.json(
            { error: 'Customer ID not configured' },
            { status: 400 }
          );
        }
        result = await marketingSyncService.syncGoogleAds(
          integration_id,
          user.id,
          config.customer_id
        );
      } else {
        return NextResponse.json(
          { error: 'Unsupported service type' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: result.success,
        synced_count: result.syncedCount,
        errors: result.errors,
        duration_ms: result.duration,
      });
    }

    // 否则同步所有营销集成
    const results = await marketingSyncService.syncAllMarketingIntegrations(
      user.id
    );

    return NextResponse.json({
      success: results.totalErrors === 0,
      total_synced: results.totalSynced,
      total_errors: results.totalErrors,
      results: results.results.map((r) => ({
        integration_id: r.integrationId,
        service_name: r.serviceName,
        synced_count: r.result.syncedCount,
        errors: r.result.errors,
        duration_ms: r.result.duration,
      })),
    });
  } catch (error) {
    console.error('Error in POST /api/marketing/sync:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
