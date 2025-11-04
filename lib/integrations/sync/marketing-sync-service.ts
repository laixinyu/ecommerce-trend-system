// 营销数据同步服务
import { createClient } from '@/lib/supabase/server';
import { getIntegrationCredentials, updateLastSyncTime, markIntegrationError } from '../integration-helper';
import { MetaAdsClient } from '../clients/meta-ads-client';
import { GoogleAdsClient } from '../clients/google-ads-client';
import type { Database } from '@/types/database';

type AdCampaignInsert = Database['public']['Tables']['ad_campaigns']['Insert'];

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  duration: number;
}

/**
 * 营销数据同步服务
 * 负责从第三方平台同步广告数据到数据库
 */
export class MarketingSyncService {
  /**
   * 同步Meta Ads数据
   * @param integrationId 集成ID
   * @param userId 用户ID
   * @param adAccountId Meta广告账户ID
   */
  async syncMetaAds(
    integrationId: string,
    userId: string,
    adAccountId: string
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // 获取凭证
      const credentials = await getIntegrationCredentials(integrationId, userId);
      const client = new MetaAdsClient(credentials.access_token);

      // 获取广告活动
      const campaigns = await client.getCampaigns(adAccountId, {
        status: ['ACTIVE', 'PAUSED'],
      });

      const supabase = await createClient();

      // 获取最近30天的数据
      const dateRange = {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        until: new Date().toISOString().split('T')[0],
      };

      // 同步每个广告活动
      for (const campaign of campaigns) {
        try {
          // 获取洞察数据
          const insights = await client.getCampaignInsights(
            campaign.id,
            dateRange
          );

          // 准备数据
          const campaignData: AdCampaignInsert = {
            integration_id: integrationId,
            platform: 'meta',
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            status:
              campaign.status === 'ACTIVE'
                ? 'active'
                : campaign.status === 'PAUSED'
                  ? 'paused'
                  : 'ended',
            daily_budget: campaign.daily_budget
              ? parseFloat(campaign.daily_budget) / 100
              : null,
            metrics: {
              impressions: parseInt(insights.impressions || '0'),
              clicks: parseInt(insights.clicks || '0'),
              spend: parseFloat(insights.spend || '0'),
              reach: parseInt(insights.reach || '0'),
              ctr: parseFloat(insights.ctr || '0'),
              cpc: parseFloat(insights.cpc || '0'),
              cpm: parseFloat(insights.cpm || '0'),
              conversions: parseInt(insights.conversions || '0'),
              conversion_value: parseFloat(insights.conversion_value || '0'),
            },
          };

          // 插入或更新数据
          const { error } = await supabase
            .from('ad_campaigns')
            .upsert(campaignData, {
              onConflict: 'integration_id,campaign_id',
            });

          if (error) {
            errors.push(`Failed to sync campaign ${campaign.id}: ${error.message}`);
          } else {
            syncedCount++;
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error syncing campaign ${campaign.id}: ${errorMsg}`);
        }
      }

      // 更新同步时间
      await updateLastSyncTime(integrationId);

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await markIntegrationError(integrationId, errorMsg);

      return {
        success: false,
        syncedCount,
        errors: [errorMsg, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 同步Google Ads数据
   * @param integrationId 集成ID
   * @param userId 用户ID
   * @param customerId Google Ads客户ID
   */
  async syncGoogleAds(
    integrationId: string,
    userId: string,
    customerId: string
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // 获取凭证
      const credentials = await getIntegrationCredentials(integrationId, userId);
      const client = new GoogleAdsClient(credentials.access_token, customerId);

      // 获取广告活动
      const campaigns = await client.getCampaigns({
        status: ['ENABLED', 'PAUSED'],
      });

      const supabase = await createClient();

      // 获取最近30天的数据
      const dateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      };

      // 同步每个广告活动
      for (const campaign of campaigns) {
        try {
          // 获取指标数据
          const metrics = await client.getCampaignMetrics(
            campaign.id,
            dateRange
          );

          // 准备数据
          const campaignData: AdCampaignInsert = {
            integration_id: integrationId,
            platform: 'google',
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            status:
              campaign.status === 'ENABLED'
                ? 'active'
                : campaign.status === 'PAUSED'
                  ? 'paused'
                  : 'ended',
            daily_budget: campaign.budget.amountMicros
              ? parseFloat(campaign.budget.amountMicros) / 1000000
              : null,
            metrics: {
              impressions: parseInt(metrics.impressions || '0'),
              clicks: parseInt(metrics.clicks || '0'),
              cost: parseFloat(metrics.cost || '0'),
              conversions: parseFloat(metrics.conversions || '0'),
              conversion_value: parseFloat(metrics.conversionValue || '0'),
              ctr: parseFloat(metrics.ctr || '0'),
              average_cpc: parseFloat(metrics.averageCpc || '0'),
              average_cpm: parseFloat(metrics.averageCpm || '0'),
            },
          };

          // 插入或更新数据
          const { error } = await supabase
            .from('ad_campaigns')
            .upsert(campaignData, {
              onConflict: 'integration_id,campaign_id',
            });

          if (error) {
            errors.push(`Failed to sync campaign ${campaign.id}: ${error.message}`);
          } else {
            syncedCount++;
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error syncing campaign ${campaign.id}: ${errorMsg}`);
        }
      }

      // 更新同步时间
      await updateLastSyncTime(integrationId);

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await markIntegrationError(integrationId, errorMsg);

      return {
        success: false,
        syncedCount,
        errors: [errorMsg, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 同步所有营销集成
   * @param userId 用户ID
   */
  async syncAllMarketingIntegrations(userId: string): Promise<{
    results: Array<{
      integrationId: string;
      serviceName: string;
      result: SyncResult;
    }>;
    totalSynced: number;
    totalErrors: number;
  }> {
    const supabase = await createClient();

    // 获取所有营销类型的集成
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('service_type', 'marketing')
      .eq('status', 'active');

    if (error || !integrations) {
      throw new Error('Failed to fetch integrations');
    }

    const results = [];
    let totalSynced = 0;
    let totalErrors = 0;

    for (const integration of integrations) {
      let result: SyncResult;

      try {
        // 根据服务类型调用相应的同步方法
        if (integration.service_name === 'meta_ads') {
          const config = integration.config as { ad_account_id?: string };
          if (!config.ad_account_id) {
            result = {
              success: false,
              syncedCount: 0,
              errors: ['Ad account ID not configured'],
              duration: 0,
            };
          } else {
            result = await this.syncMetaAds(
              integration.id,
              userId,
              config.ad_account_id
            );
          }
        } else if (integration.service_name === 'google_ads') {
          const config = integration.config as { customer_id?: string };
          if (!config.customer_id) {
            result = {
              success: false,
              syncedCount: 0,
              errors: ['Customer ID not configured'],
              duration: 0,
            };
          } else {
            result = await this.syncGoogleAds(
              integration.id,
              userId,
              config.customer_id
            );
          }
        } else {
          result = {
            success: false,
            syncedCount: 0,
            errors: [`Unsupported service: ${integration.service_name}`],
            duration: 0,
          };
        }

        results.push({
          integrationId: integration.id,
          serviceName: integration.service_name,
          result,
        });

        totalSynced += result.syncedCount;
        totalErrors += result.errors.length;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({
          integrationId: integration.id,
          serviceName: integration.service_name,
          result: {
            success: false,
            syncedCount: 0,
            errors: [errorMsg],
            duration: 0,
          },
        });
        totalErrors++;
      }
    }

    return {
      results,
      totalSynced,
      totalErrors,
    };
  }
}

// 导出单例实例
export const marketingSyncService = new MarketingSyncService();
