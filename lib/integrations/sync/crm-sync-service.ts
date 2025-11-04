// CRM数据同步服务
import { createClient } from '@/lib/supabase/server';
import { HubSpotClient } from '../clients/hubspot-client';
import { KlaviyoClient } from '../clients/klaviyo-client';
import { Encryption } from '@/lib/security/encryption';

export interface CRMCustomer {
  external_id: string;
  email: string;
  name: string;
  phone?: string;
  first_purchase_at?: string;
  last_purchase_at?: string;
  total_orders: number;
  total_spent: number;
  lifecycle_stage?: string;
  source: 'hubspot' | 'klaviyo';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_data: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  customersImported: number;
  customersUpdated: number;
  errors: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

/**
 * CRM数据同步服务
 * 负责从HubSpot和Klaviyo导入和同步客户数据
 */
export class CRMSyncService {
  /**
   * 同步HubSpot客户数据
   * @param integrationId 集成ID
   */
  async syncHubSpotCustomers(integrationId: string): Promise<SyncResult> {
    const supabase = await createClient();
    const result: SyncResult = {
      success: false,
      customersImported: 0,
      customersUpdated: 0,
      errors: [],
    };

    try {
      // 获取集成配置
      const { data: integration, error: integrationError } = await (supabase as SupabaseAny)
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (integrationError || !integration) {
        throw new Error('Integration not found');
      }

      // 解密凭证
      const decryptedToken = Encryption.decrypt(
        integration.credentials.access_token
      );

      // 创建HubSpot客户端
      const hubspot = new HubSpotClient(decryptedToken);

      // 获取所有联系人
      const contacts = await hubspot.getAllContacts(1000);

      // 转换并导入数据
      for (const contact of contacts) {
        try {
          // 获取联系人的交易记录
          const deals = await hubspot.getContactDeals(contact.id);

          // 计算总订单数和总消费
          const totalOrders = deals.length;
          const totalSpent = deals.reduce((sum, deal) => {
            return sum + (parseFloat(deal.properties.amount) || 0);
          }, 0);

          // 找出首次和最后购买日期
          const dealDates = deals
            .map((d) => d.properties.closedate)
            .filter((d) => d)
            .sort();
          const firstPurchaseAt = dealDates[0] || contact.createdAt;
          const lastPurchaseAt = dealDates[dealDates.length - 1] || contact.createdAt;

          const customer: CRMCustomer = {
            external_id: contact.id,
            email: contact.properties.email,
            name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || contact.properties.email,
            phone: contact.properties.phone,
            first_purchase_at: firstPurchaseAt,
            last_purchase_at: lastPurchaseAt,
            total_orders: totalOrders,
            total_spent: totalSpent,
            lifecycle_stage: contact.properties.lifecyclestage,
            source: 'hubspot',
            raw_data: contact,
          };

          // 插入或更新客户数据
          const { error: upsertError } = await (supabase as SupabaseAny)
            .from('crm_customers')
            .upsert(
              {
                user_id: integration.user_id,
                external_id: customer.external_id,
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                first_purchase_at: customer.first_purchase_at,
                last_purchase_at: customer.last_purchase_at,
                total_orders: customer.total_orders,
                total_spent: customer.total_spent,
                segment: 'new', // 将在RFM分析后更新
                rfm_score: {},
                ltv: customer.total_spent,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'user_id,external_id',
              }
            );

          if (upsertError) {
            result.errors.push(`Failed to import ${customer.email}: ${upsertError.message}`);
          } else {
            result.customersImported++;
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          result.errors.push(`Error processing contact ${contact.id}: ${error.message}`);
        }
      }

      // 更新最后同步时间
      await (supabase as SupabaseAny)
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integrationId);

      result.success = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
    }

    return result;
  }

  /**
   * 同步Klaviyo客户数据
   * @param integrationId 集成ID
   */
  async syncKlaviyoCustomers(integrationId: string): Promise<SyncResult> {
    const supabase = await createClient();
    const result: SyncResult = {
      success: false,
      customersImported: 0,
      customersUpdated: 0,
      errors: [],
    };

    try {
      // 获取集成配置
      const { data: integration, error: integrationError } = await (supabase as SupabaseAny)
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (integrationError || !integration) {
        throw new Error('Integration not found');
      }

      // 解密API密钥
      const decryptedKey = Encryption.decrypt(
        integration.credentials.access_token
      );

      // 创建Klaviyo客户端
      const klaviyo = new KlaviyoClient(decryptedKey);

      // 获取所有用户档案
      const profiles = await klaviyo.getAllProfiles(1000);

      // 获取订单事件用于计算购买数据
      const orderEvents = await klaviyo.getOrderEvents();

      // 转换并导入数据
      for (const profile of profiles) {
        try {
          // 获取该用户的订单事件
          const userOrders = orderEvents.filter((event) => {
            return event.attributes.properties?.profile_id === profile.id;
          });

          // 计算总订单数和总消费
          const totalOrders = userOrders.length;
          const totalSpent = userOrders.reduce((sum, event) => {
            return sum + (event.attributes.value || 0);
          }, 0);

          // 找出首次和最后购买日期
          const orderDates = userOrders
            .map((e) => e.attributes.timestamp)
            .sort();
          const firstPurchaseAt = orderDates[0] || profile.attributes.created;
          const lastPurchaseAt = orderDates[orderDates.length - 1] || profile.attributes.created;

          const customer: CRMCustomer = {
            external_id: profile.id,
            email: profile.attributes.email,
            name: `${profile.attributes.first_name || ''} ${profile.attributes.last_name || ''}`.trim() || profile.attributes.email,
            phone: profile.attributes.phone_number,
            first_purchase_at: firstPurchaseAt,
            last_purchase_at: lastPurchaseAt,
            total_orders: totalOrders,
            total_spent: totalSpent,
            source: 'klaviyo',
            raw_data: profile,
          };

          // 插入或更新客户数据
          const { error: upsertError } = await (supabase as SupabaseAny)
            .from('crm_customers')
            .upsert(
              {
                user_id: integration.user_id,
                external_id: customer.external_id,
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                first_purchase_at: customer.first_purchase_at,
                last_purchase_at: customer.last_purchase_at,
                total_orders: customer.total_orders,
                total_spent: customer.total_spent,
                segment: 'new',
                rfm_score: {},
                ltv: customer.total_spent,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'user_id,external_id',
              }
            );

          if (upsertError) {
            result.errors.push(`Failed to import ${customer.email}: ${upsertError.message}`);
          } else {
            result.customersImported++;
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          result.errors.push(`Error processing profile ${profile.id}: ${error.message}`);
        }
      }

      // 更新最后同步时间
      await (supabase as SupabaseAny)
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integrationId);

      result.success = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      result.errors.push(`Sync failed: ${error.message}`);
    }

    return result;
  }

  /**
   * 同步所有CRM集成
   * @param userId 用户ID
   */
  async syncAllCRMIntegrations(userId: string): Promise<SyncResult[]> {
    const supabase = await createClient();

    // 获取所有CRM类型的集成
    const { data: integrations } = await (supabase as SupabaseAny)
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('service_type', 'crm')
      .eq('status', 'active');

    if (!integrations || integrations.length === 0) {
      return [];
    }

    const results: SyncResult[] = [];

    for (const integration of integrations) {
      let result: SyncResult;

      if (integration.service_name === 'hubspot') {
        result = await this.syncHubSpotCustomers(integration.id);
      } else if (integration.service_name === 'klaviyo') {
        result = await this.syncKlaviyoCustomers(integration.id);
      } else {
        continue;
      }

      results.push(result);
    }

    return results;
  }
}

export const crmSyncService = new CRMSyncService();
