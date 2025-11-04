/**
 * Shopify API客户端
 * 用于与Shopify API交互，获取订单和库存数据
 */

import { Logger } from '@/lib/utils/logger';
import { retryWithBackoff } from '@/lib/utils/retry';
import type {
  ShopifyProduct,
  ShopifyOrder,
  OrderItem,
  ShippingInfo,
} from '@/types/supply-chain';

interface ShopifyConfig {
  shop_domain: string;
  access_token: string;
  api_version?: string;
}

export class ShopifyClient {
  private config: ShopifyConfig;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.config = {
      ...config,
      api_version: config.api_version || '2024-01',
    };
    this.baseUrl = `https://${this.config.shop_domain}/admin/api/${this.config.api_version}`;
  }

  /**
   * 发起API请求
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await retryWithBackoff(async () => {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.config.access_token,
          ...options.headers,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Shopify API error: ${res.status} - ${error}`);
      }

      return res;
    });

    return response.json();
  }

  /**
   * 获取产品列表及库存信息
   */
  async getProducts(limit: number = 250): Promise<ShopifyProduct[]> {
    try {
      Logger.info('Fetching products from Shopify', { limit });
      
      const response = await this.request<{ products: ShopifyProduct[] }>(
        `/products.json?limit=${limit}&fields=id,title,variants`
      );

      Logger.info('Successfully fetched Shopify products', {
        count: response.products.length,
      });

      return response.products;
    } catch (error) {
      Logger.error('Failed to fetch Shopify products', error as Error);
      throw error;
    }
  }

  /**
   * 获取单个产品的库存信息
   */
  async getProductInventory(productId: number): Promise<ShopifyProduct> {
    try {
      const response = await this.request<{ product: ShopifyProduct }>(
        `/products/${productId}.json?fields=id,title,variants`
      );

      return response.product;
    } catch (error) {
      Logger.error('Failed to fetch product inventory', error as Error, { productId });
      throw error;
    }
  }

  /**
   * 更新库存数量
   */
  async updateInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    availableQuantity: number
  ): Promise<void> {
    try {
      Logger.info('Updating inventory level', {
        inventoryItemId,
        locationId,
        availableQuantity,
      });

      await this.request('/inventory_levels/set.json', {
        method: 'POST',
        body: JSON.stringify({
          location_id: locationId,
          inventory_item_id: inventoryItemId,
          available: availableQuantity,
        }),
      });

      Logger.info('Successfully updated inventory level');
    } catch (error) {
      Logger.error('Failed to update inventory level', error as Error);
      throw error;
    }
  }

  /**
   * 获取订单列表
   */
  async getOrders(params: {
    status?: string;
    limit?: number;
    since_id?: number;
    created_at_min?: string;
  } = {}): Promise<ShopifyOrder[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.since_id) queryParams.append('since_id', params.since_id.toString());
      if (params.created_at_min) queryParams.append('created_at_min', params.created_at_min);

      Logger.info('Fetching orders from Shopify', params);

      const response = await this.request<{ orders: ShopifyOrder[] }>(
        `/orders.json?${queryParams.toString()}`
      );

      Logger.info('Successfully fetched Shopify orders', {
        count: response.orders.length,
      });

      return response.orders;
    } catch (error) {
      Logger.error('Failed to fetch Shopify orders', error as Error);
      throw error;
    }
  }

  /**
   * 获取单个订单详情
   */
  async getOrder(orderId: number): Promise<ShopifyOrder> {
    try {
      const response = await this.request<{ order: ShopifyOrder }>(
        `/orders/${orderId}.json`
      );

      return response.order;
    } catch (error) {
      Logger.error('Failed to fetch order', error as Error, { orderId });
      throw error;
    }
  }

  /**
   * 将Shopify订单转换为系统订单格式
   */
  convertToSystemOrder(shopifyOrder: ShopifyOrder): {
    external_order_id: string;
    platform: 'shopify';
    status: string;
    items: OrderItem[];
    total_amount: number;
    shipping_info: ShippingInfo | null;
  } {
    const items: OrderItem[] = shopifyOrder.line_items.map((item) => ({
      sku: item.sku || '',
      product_name: item.name,
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      total_price: parseFloat(item.price) * item.quantity,
    }));

    // 映射Shopify订单状态到系统状态
    let status: string = 'pending';
    if (shopifyOrder.fulfillment_status === 'fulfilled') {
      status = 'delivered';
    } else if (shopifyOrder.fulfillment_status === 'partial') {
      status = 'processing';
    } else if (shopifyOrder.financial_status === 'paid') {
      status = 'processing';
    }

    return {
      external_order_id: shopifyOrder.order_number.toString(),
      platform: 'shopify',
      status,
      items,
      total_amount: parseFloat(shopifyOrder.total_price),
      shipping_info: null, // 需要从fulfillments获取
    };
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/shop.json');
      return true;
    } catch (error) {
      Logger.error('Shopify connection test failed', error as Error);
      return false;
    }
  }
}
