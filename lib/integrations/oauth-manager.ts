// OAuth 2.0 认证管理器
import axios from 'axios';
import { Encryption } from '../security/encryption';
import type {
  OAuthConfig,
  OAuthTokenResponse,
  OAuthState,
} from '@/types/integration';

/**
 * OAuth 2.0 认证管理器
 * 处理第三方服务的OAuth授权流程和token管理
 */
export class OAuthManager {
  private stateStore: Map<string, OAuthState> = new Map();
  private readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10分钟

  /**
   * 获取服务的OAuth配置
   * @param serviceName 服务名称
   * @returns OAuth配置
   */
  private getOAuthConfig(serviceName: string): OAuthConfig {
    const configs: Record<string, OAuthConfig> = {
      meta_ads: {
        client_id: process.env.META_APP_ID || '',
        client_secret: process.env.META_APP_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`,
        authorization_endpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
        token_endpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
        scopes: ['ads_read', 'ads_management', 'business_management'],
      },
      google_ads: {
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`,
        authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        token_endpoint: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/adwords'],
      },
      hubspot: {
        client_id: process.env.HUBSPOT_CLIENT_ID || '',
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`,
        authorization_endpoint: 'https://app.hubspot.com/oauth/authorize',
        token_endpoint: 'https://api.hubapi.com/oauth/v1/token',
        scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
      },
      shopify: {
        client_id: process.env.SHOPIFY_API_KEY || '',
        client_secret: process.env.SHOPIFY_API_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`,
        authorization_endpoint: '', // Shopify使用店铺特定的URL
        token_endpoint: '', // Shopify使用店铺特定的URL
        scopes: ['read_orders', 'read_products', 'read_inventory'],
      },
    };

    const config = configs[serviceName];
    if (!config) {
      throw new Error(`OAuth config not found for service: ${serviceName}`);
    }

    return config;
  }

  /**
   * 生成安全的state token
   * @returns state token
   */
  private generateStateToken(): string {
    return Encryption.generateSecureToken(32);
  }

  /**
   * 存储state信息
   * @param state state token
   * @param data state数据
   */
  private storeState(state: string, data: OAuthState): void {
    this.stateStore.set(state, data);

    // 设置过期清理
    setTimeout(() => {
      this.stateStore.delete(state);
    }, this.STATE_EXPIRY_MS);
  }

  /**
   * 验证并获取state信息
   * @param state state token
   * @returns state数据
   */
  private validateState(state: string): OAuthState {
    const data = this.stateStore.get(state);
    if (!data) {
      throw new Error('Invalid or expired state token');
    }

    // 检查是否过期
    if (Date.now() - data.created_at > this.STATE_EXPIRY_MS) {
      this.stateStore.delete(state);
      throw new Error('State token expired');
    }

    // 使用后删除
    this.stateStore.delete(state);
    return data;
  }

  /**
   * 初始化OAuth授权流程
   * @param serviceName 服务名称
   * @param userId 用户ID
   * @param additionalParams 额外的授权参数
   * @returns 授权URL
   */
  async initiateAuth(
    serviceName: string,
    userId: string,
    additionalParams?: Record<string, string>
  ): Promise<string> {
    const config = this.getOAuthConfig(serviceName);

    // 生成state token
    const stateToken = this.generateStateToken();
    this.storeState(stateToken, {
      user_id: userId,
      service_name: serviceName,
      state_token: stateToken,
      created_at: Date.now(),
    });

    // 构建授权URL
    const params = new URLSearchParams({
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: stateToken,
      ...additionalParams,
    });

    return `${config.authorization_endpoint}?${params.toString()}`;
  }

  /**
   * 处理OAuth回调，交换access token
   * @param code 授权码
   * @param state state token
   * @returns token响应和用户ID
   */
  async handleCallback(
    code: string,
    state: string
  ): Promise<{ tokens: OAuthTokenResponse; userId: string; serviceName: string }> {
    // 验证state
    const stateData = this.validateState(state);
    const config = this.getOAuthConfig(stateData.service_name);

    // 交换access token
    const tokens = await this.exchangeCodeForTokens(
      stateData.service_name,
      code,
      config
    );

    return {
      tokens,
      userId: stateData.user_id,
      serviceName: stateData.service_name,
    };
  }

  /**
   * 交换授权码获取access token
   * @param serviceName 服务名称
   * @param code 授权码
   * @param config OAuth配置
   * @returns token响应
   */
  private async exchangeCodeForTokens(
    serviceName: string,
    code: string,
    config: OAuthConfig
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await axios.post<OAuthTokenResponse>(
        config.token_endpoint,
        {
          client_id: config.client_id,
          client_secret: config.client_secret,
          code,
          redirect_uri: config.redirect_uri,
          grant_type: 'authorization_code',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * 刷新access token
   * @param serviceName 服务名称
   * @param refreshToken refresh token
   * @returns 新的token响应
   */
  async refreshToken(
    serviceName: string,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    const config = this.getOAuthConfig(serviceName);

    try {
      const response = await axios.post<OAuthTokenResponse>(
        config.token_endpoint,
        {
          client_id: config.client_id,
          client_secret: config.client_secret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to refresh token: ${error.response?.data?.error_description || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * 检查token是否即将过期
   * @param expiresAt 过期时间戳（ISO字符串）
   * @param bufferMinutes 提前刷新的缓冲时间（分钟）
   * @returns 是否需要刷新
   */
  shouldRefreshToken(expiresAt: string, bufferMinutes: number = 5): boolean {
    const expiryTime = new Date(expiresAt).getTime();
    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() >= expiryTime - bufferMs;
  }

  /**
   * 撤销access token
   * @param serviceName 服务名称
   * @param accessToken access token
   */
  async revokeToken(serviceName: string, accessToken: string): Promise<void> {
    // 不同服务的撤销端点不同，这里提供基本实现
    const revokeEndpoints: Record<string, string> = {
      google_ads: 'https://oauth2.googleapis.com/revoke',
      meta_ads: 'https://graph.facebook.com/v18.0/me/permissions',
    };

    const endpoint = revokeEndpoints[serviceName];
    if (!endpoint) {
      // 某些服务可能不支持撤销，静默返回
      return;
    }

    try {
      await axios.post(endpoint, { token: accessToken });
    } catch (error) {
      // 撤销失败不应该阻止流程
      console.error(`Failed to revoke token for ${serviceName}:`, error);
    }
  }
}

// 导出单例实例
export const oauthManager = new OAuthManager();
