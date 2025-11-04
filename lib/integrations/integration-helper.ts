// 集成辅助函数
import { createClient } from '@/lib/supabase/server';
import { Encryption } from '@/lib/security/encryption';
import { oauthManager } from './oauth-manager';
import type { Integration, EncryptedCredentials } from '@/types/integration';

/**
 * 获取集成的解密凭证
 * @param integrationId 集成ID
 * @param userId 用户ID
 * @returns 解密后的凭证
 */
export async function getIntegrationCredentials(
  integrationId: string,
  userId: string
): Promise<EncryptedCredentials> {
  const supabase = await createClient();

  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('user_id', userId)
    .single();

  if (error || !integration) {
    throw new Error('Integration not found');
  }

  // 解密凭证
  const credentials = Encryption.decryptObject<EncryptedCredentials>(
    integration.credentials
  );

  // 检查token是否需要刷新
  if (
    credentials.expires_at &&
    credentials.refresh_token &&
    oauthManager.shouldRefreshToken(credentials.expires_at)
  ) {
    // 自动刷新token
    const newTokens = await oauthManager.refreshToken(
      integration.service_name,
      credentials.refresh_token
    );

    // 更新凭证
    credentials.access_token = newTokens.access_token;
    credentials.refresh_token =
      newTokens.refresh_token || credentials.refresh_token;
    credentials.expires_at = newTokens.expires_in
      ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
      : credentials.expires_at;

    // 保存更新后的凭证
    const encryptedCredentials = Encryption.encryptObject(credentials);
    await supabase
      .from('integrations')
      .update({ credentials: encryptedCredentials })
      .eq('id', integrationId);
  }

  return credentials;
}

/**
 * 获取用户的特定服务集成
 * @param userId 用户ID
 * @param serviceName 服务名称
 * @returns 集成信息（不含解密凭证）
 */
export async function getUserIntegration(
  userId: string,
  serviceName: string
): Promise<Integration | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('service_name', serviceName)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * 更新集成的同步时间
 * @param integrationId 集成ID
 */
export async function updateLastSyncTime(integrationId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('integrations')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', integrationId);
}

/**
 * 标记集成为错误状态
 * @param integrationId 集成ID
 * @param errorMessage 错误信息
 */
export async function markIntegrationError(
  integrationId: string,
  errorMessage: string
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('integrations')
    .update({
      status: 'error',
      config: {
        last_error: errorMessage,
        error_at: new Date().toISOString(),
      },
    })
    .eq('id', integrationId);
}

/**
 * 检查用户是否有特定服务的集成
 * @param userId 用户ID
 * @param serviceName 服务名称
 * @returns 是否存在活跃集成
 */
export async function hasActiveIntegration(
  userId: string,
  serviceName: string
): Promise<boolean> {
  const integration = await getUserIntegration(userId, serviceName);
  return integration !== null;
}
