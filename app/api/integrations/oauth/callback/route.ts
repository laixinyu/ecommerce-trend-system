// OAuth回调处理API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { oauthManager } from '@/lib/integrations/oauth-manager';
import { Encryption } from '@/lib/security/encryption';

/**
 * GET /api/integrations/oauth/callback
 * 处理OAuth回调
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 检查是否有错误
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/integrations?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`,
          request.url
        )
      );
    }

    // 验证必需参数
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          '/integrations?error=invalid_request&error_description=Missing code or state',
          request.url
        )
      );
    }

    // 处理回调，交换token
    const { tokens, userId, serviceName } = await oauthManager.handleCallback(
      code,
      state
    );

    // 准备凭证对象
    const credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : undefined,
      token_type: tokens.token_type,
      scope: tokens.scope,
    };

    // 加密凭证
    const encryptedCredentials = Encryption.encryptObject(credentials);

    // 保存到数据库
    const supabase = await createClient();

    // 确定服务类型
    const serviceTypeMap: Record<string, string> = {
      meta_ads: 'marketing',
      google_ads: 'marketing',
      hubspot: 'crm',
      shopify: 'supply_chain',
    };

    const serviceType = serviceTypeMap[serviceName] || 'marketing';

    const { data, error: dbError } = await supabase
      .from('integrations')
      .insert({
        user_id: userId,
        service_name: serviceName,
        service_type: serviceType,
        credentials: encryptedCredentials,
        status: 'active',
        config: {},
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving integration:', dbError);
      return NextResponse.redirect(
        new URL(
          '/integrations?error=database_error&error_description=Failed to save integration',
          request.url
        )
      );
    }

    // 重定向到成功页面
    return NextResponse.redirect(
      new URL(`/integrations?success=true&integration_id=${data.id}`, request.url)
    );
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/integrations?error=callback_error&error_description=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
        request.url
      )
    );
  }
}
