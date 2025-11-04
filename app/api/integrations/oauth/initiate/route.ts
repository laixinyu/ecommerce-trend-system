// OAuth授权初始化API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { oauthManager } from '@/lib/integrations/oauth-manager';

/**
 * POST /api/integrations/oauth/initiate
 * 初始化OAuth授权流程
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
    const { service_name, additional_params } = body;

    if (!service_name) {
      return NextResponse.json(
        { error: 'service_name is required' },
        { status: 400 }
      );
    }

    // 生成授权URL
    const authUrl = await oauthManager.initiateAuth(
      service_name,
      user.id,
      additional_params
    );

    return NextResponse.json({ auth_url: authUrl });
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
