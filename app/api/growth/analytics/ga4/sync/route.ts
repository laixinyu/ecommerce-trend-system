// Google Analytics 4 数据同步API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleAnalyticsClient } from '@/lib/integrations/clients/google-analytics-client';
import { Encryption } from '@/lib/security/encryption';

/**
 * POST /api/growth/analytics/ga4/sync
 * 同步GA4数据
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

    // 获取集成配置
    const { data: integration, error: integrationError } = await supabase
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

    // 解密凭证
    const decryptedToken = Encryption.decrypt(
      integration.credentials.access_token
    );
    const propertyId = integration.config.property_id;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'GA4 property_id not configured' },
        { status: 400 }
      );
    }

    // 创建GA4客户端
    const ga4 = new GoogleAnalyticsClient(decryptedToken, propertyId);

    // 获取用户行为数据
    const behaviors = await ga4.getUserBehaviorPath({
      startDate: '7daysAgo',
      endDate: 'today',
    });

    // 导入到数据库
    let imported = 0;
    for (const behavior of behaviors) {
      for (const event of behavior.events) {
        const { error: insertError } = await supabase
          .from('user_events')
          .insert({
            user_id: user.id,
            event_name: event.name,
            event_type: 'custom',
            properties: { count: event.count },
            page_url: behavior.page_path,
            session_id: behavior.session_id,
            timestamp: behavior.timestamp,
            created_at: new Date().toISOString(),
          });

        if (!insertError) {
          imported++;
        }
      }
    }

    // 更新最后同步时间
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration_id);

    return NextResponse.json({
      success: true,
      events_imported: imported,
    });
  } catch (error: any) {
    console.error('GA4 sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync GA4 data' },
      { status: 500 }
    );
  }
}
