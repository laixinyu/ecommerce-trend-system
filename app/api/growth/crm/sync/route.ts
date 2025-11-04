// CRM数据同步API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crmSyncService } from '@/lib/integrations/sync/crm-sync-service';

/**
 * POST /api/growth/crm/sync
 * 同步CRM数据
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

    const body = await request.json();
    const { integration_id } = body;

    if (!integration_id) {
      return NextResponse.json(
        { error: 'integration_id is required' },
        { status: 400 }
      );
    }

    // 获取集成信息
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: integration, error: integrationError } = await (supabase as any)
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // 根据服务类型同步数据
    let result;
    if (integration.service_name === 'hubspot') {
      result = await crmSyncService.syncHubSpotCustomers(integration_id);
    } else if (integration.service_name === 'klaviyo') {
      result = await crmSyncService.syncKlaviyoCustomers(integration_id);
    } else {
      return NextResponse.json(
        { error: 'Unsupported CRM service' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('CRM sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync CRM data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/growth/crm/sync
 * 同步所有CRM集成
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // 同步所有CRM集成
    const results = await crmSyncService.syncAllCRMIntegrations(user.id);

    return NextResponse.json({ results });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('CRM sync all error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync CRM data' },
      { status: 500 }
    );
  }
}
