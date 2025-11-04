// Token刷新API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { oauthManager } from '@/lib/integrations/oauth-manager';
import { Encryption } from '@/lib/security/encryption';

/**
 * POST /api/integrations/[id]/refresh-token
 * 刷新集成的access token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取集成信息
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // 解密凭证
    const credentials = Encryption.decryptObject(integration.credentials);

    if (!credentials.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 }
      );
    }

    // 刷新token
    const newTokens = await oauthManager.refreshToken(
      integration.service_name,
      credentials.refresh_token
    );

    // 更新凭证
    const updatedCredentials = {
      ...credentials,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || credentials.refresh_token,
      expires_at: newTokens.expires_in
        ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        : credentials.expires_at,
    };

    // 加密并保存
    const encryptedCredentials = Encryption.encryptObject(updatedCredentials);

    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        credentials: encryptedCredentials,
        status: 'active',
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating credentials:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      {
        error: 'Failed to refresh token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
