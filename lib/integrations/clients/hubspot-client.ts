// HubSpot CRM API客户端
import axios, { AxiosInstance } from 'axios';
import { rateLimiter } from '../rate-limiter';
import { retryWithBackoff } from '@/lib/utils/retry';

export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    lifecyclestage?: string;
    createdate: string;
    lastmodifieddate: string;
    hs_object_id: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    dealstage: string;
    pipeline: string;
    closedate?: string;
    createdate: string;
  };
}

export interface HubSpotEngagement {
  id: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK';
  timestamp: string;
  properties: Record<string, any>;
}

export interface HubSpotContactWithDeals extends HubSpotContact {
  deals: HubSpotDeal[];
  totalRevenue: number;
  dealCount: number;
}

/**
 * HubSpot CRM API客户端
 * 用于获取客户数据、交易记录和互动历史
 */
export class HubSpotClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://api.hubapi.com',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 获取联系人列表
   * @param params 查询参数
   */
  async getContacts(params?: {
    limit?: number;
    after?: string;
    properties?: string[];
  }): Promise<{ contacts: HubSpotContact[]; paging?: { next?: { after: string } } }> {
    return rateLimiter.throttle('hubspot', async () => {
      return retryWithBackoff(async () => {
        const properties = params?.properties || [
          'email',
          'firstname',
          'lastname',
          'phone',
          'lifecyclestage',
          'createdate',
          'lastmodifieddate',
        ];

        const response = await this.client.get('/crm/v3/objects/contacts', {
          params: {
            limit: params?.limit || 100,
            after: params?.after,
            properties: properties.join(','),
          },
        });

        return {
          contacts: response.data.results,
          paging: response.data.paging,
        };
      });
    });
  }

  /**
   * 获取单个联系人详情
   * @param contactId 联系人ID
   */
  async getContact(contactId: string): Promise<HubSpotContact> {
    return rateLimiter.throttle('hubspot', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/crm/v3/objects/contacts/${contactId}`, {
          params: {
            properties: 'email,firstname,lastname,phone,lifecyclestage,createdate,lastmodifieddate',
          },
        });
        return response.data;
      });
    });
  }

  /**
   * 获取联系人的交易记录
   * @param contactId 联系人ID
   */
  async getContactDeals(contactId: string): Promise<HubSpotDeal[]> {
    return rateLimiter.throttle('hubspot', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(
          `/crm/v3/objects/contacts/${contactId}/associations/deals`
        );

        if (!response.data.results || response.data.results.length === 0) {
          return [];
        }

        // 获取交易详情
        const dealIds = response.data.results.map((r: any) => r.id);
        const deals = await Promise.all(
          dealIds.map((id: string) => this.getDeal(id))
        );

        return deals;
      });
    });
  }

  /**
   * 获取交易详情
   * @param dealId 交易ID
   */
  async getDeal(dealId: string): Promise<HubSpotDeal> {
    return rateLimiter.throttle('hubspot', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(`/crm/v3/objects/deals/${dealId}`, {
          params: {
            properties: 'dealname,amount,dealstage,pipeline,closedate,createdate',
          },
        });
        return response.data;
      });
    });
  }

  /**
   * 获取联系人及其交易记录
   * @param contactId 联系人ID
   */
  async getContactWithDeals(contactId: string): Promise<HubSpotContactWithDeals> {
    const contact = await this.getContact(contactId);
    const deals = await this.getContactDeals(contactId);

    const totalRevenue = deals.reduce((sum, deal) => {
      return sum + (parseFloat(deal.properties.amount) || 0);
    }, 0);

    return {
      ...contact,
      deals,
      totalRevenue,
      dealCount: deals.length,
    };
  }

  /**
   * 批量获取所有联系人（处理分页）
   * @param maxContacts 最大获取数量
   */
  async getAllContacts(maxContacts: number = 1000): Promise<HubSpotContact[]> {
    const allContacts: HubSpotContact[] = [];
    let after: string | undefined;

    while (allContacts.length < maxContacts) {
      const result = await this.getContacts({
        limit: 100,
        after,
      });

      allContacts.push(...result.contacts);

      if (!result.paging?.next?.after) {
        break;
      }

      after = result.paging.next.after;
    }

    return allContacts.slice(0, maxContacts);
  }

  /**
   * 搜索联系人
   * @param email 邮箱地址
   */
  async searchContactByEmail(email: string): Promise<HubSpotContact | null> {
    return rateLimiter.throttle('hubspot', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.post('/crm/v3/objects/contacts/search', {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: [
            'email',
            'firstname',
            'lastname',
            'phone',
            'lifecyclestage',
            'createdate',
            'lastmodifieddate',
          ],
        });

        return response.data.results[0] || null;
      });
    });
  }

  /**
   * 获取联系人的互动记录
   * @param contactId 联系人ID
   */
  async getContactEngagements(contactId: string): Promise<HubSpotEngagement[]> {
    return rateLimiter.throttle('hubspot', async () => {
      return retryWithBackoff(async () => {
        const response = await this.client.get(
          `/crm/v3/objects/contacts/${contactId}/associations/engagements`
        );

        return response.data.results || [];
      });
    });
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/crm/v3/objects/contacts', {
        params: { limit: 1 },
      });
      return true;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }
}
