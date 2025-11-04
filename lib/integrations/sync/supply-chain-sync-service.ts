/**
 * 供应链数据同步服务
 * 负责同步订单、库存和物流数据
 */

import { createClient } from '@/lib/supabase/server';
import { Logger } from '@/lib/utils/logger';
import { ShopifyClient } from '../clients/shopify-client';
import { Track17Client } from '../clients/17track-client';
import { ShipStationClient } from '../clients/shipstation-client';
import type { Integration } from '@/types/integration';
import type { InventoryItem, Order, OrderItem, ShippingInfo } from '@/types/supply-chain';

export class SupplyChainSyncService {
  /**
   * 同步Shopify订单数据
   */
  static async syncShopifyOrders(integration: Integration): Promise<number> {
    try {
      Logger.info('Starting Shopify orders sync', { integrationId: integration.id });

      const config = integration.config as { shop_domain: string };
      const credentials = integration.credentials as { access_token: string };

      const shopifyClient = new ShopifyClient({
        shop_domain: config.shop_domain,
        access_token: credentials.access_token,
      });

      // 获取最近的订单
      const lastSyncAt = integration.last_sync_at
        ? new Date(integration.last_sync_at).toISOString()
        : undefined;

      const shopifyOrders = await shopifyClient.getOrders({
        status: 'any',
        limit: 250,
        created_at_min: lastSyncAt,
      });

      const supabase = await createClient();

      let syncedCount = 0;

      for (const shopifyOrder of shopifyOrders) {
        const orderData = shopifyClient.convertToSystemOrder(shopifyOrder);

        // 检查订单是否已存在
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', integration.user_id)
          .eq('external_order_id', orderData.external_order_id)
          .eq('platform', 'shopify')
          .single();

        if (existingOrder) {
          // 更新现有订单
          await supabase
            .from('orders')
            .update({
              status: orderData.status,
              items: orderData.items as unknown as Record<string, unknown>,
              total_amount: orderData.total_amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingOrder.id);
        } else {
          // 创建新订单
          await supabase.from('orders').insert({
            user_id: integration.user_id,
            external_order_id: orderData.external_order_id,
            platform: orderData.platform,
            status: orderData.status,
            items: orderData.items as unknown as Record<string, unknown>,
            total_amount: orderData.total_amount,
            shipping_info: orderData.shipping_info as unknown as Record<string, unknown>,
          });
        }

        syncedCount++;
      }

      // 更新集成的最后同步时间
      await supabase
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      Logger.info('Shopify orders sync completed', {
        integrationId: integration.id,
        syncedCount,
      });

      return syncedCount;
    } catch (error) {
      Logger.error('Failed to sync Shopify orders', error as Error, {
        integrationId: integration.id,
      });
      throw error;
    }
  }

  /**
   * 同步Shopify库存数据
   */
  static async syncShopifyInventory(integration: Integration): Promise<number> {
    try {
      Logger.info('Starting Shopify inventory sync', { integrationId: integration.id });

      const config = integration.config as { shop_domain: string };
      const credentials = integration.credentials as { access_token: string };

      const shopifyClient = new ShopifyClient({
        shop_domain: config.shop_domain,
        access_token: credentials.access_token,
      });

      const products = await shopifyClient.getProducts();
      const supabase = await createClient();

      let syncedCount = 0;

      for (const product of products) {
        for (const variant of product.variants) {
          if (!variant.sku) continue;

          // 检查库存项是否已存在
          const { data: existingItem } = await supabase
            .from('inventory_items')
            .select('id')
            .eq('user_id', integration.user_id)
            .eq('sku', variant.sku)
            .single();

          const inventoryData = {
            user_id: integration.user_id,
            sku: variant.sku,
            product_name: `${product.title} - ${variant.sku}`,
            quantity_on_hand: variant.inventory_quantity,
            quantity_in_transit: 0,
            unit_cost: parseFloat(variant.price),
            last_updated: new Date().toISOString(),
          };

          if (existingItem) {
            // 更新现有库存
            await supabase
              .from('inventory_items')
              .update(inventoryData)
              .eq('id', existingItem.id);
          } else {
            // 创建新库存项
            await supabase.from('inventory_items').insert(inventoryData);
          }

          syncedCount++;
        }
      }

      // 更新集成的最后同步时间
      await supabase
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration.id);

      Logger.info('Shopify inventory sync completed', {
        integrationId: integration.id,
        syncedCount,
      });

      return syncedCount;
    } catch (error) {
      Logger.error('Failed to sync Shopify inventory', error as Error, {
        integrationId: integration.id,
      });
      throw error;
    }
  }

  /**
   * 更新物流追踪信息（使用17track）
   */
  static async updateTrackingInfo17track(
    integration: Integration,
    trackingNumbers: string[]
  ): Promise<number> {
    try {
      Logger.info('Starting 17track sync', {
        integrationId: integration.id,
        count: trackingNumbers.length,
      });

      const credentials = integration.credentials as { api_key: string };
      const track17Client = new Track17Client({
        api_key: credentials.api_key,
      });

      const trackingInfoList = await track17Client.getTrackingInfo(trackingNumbers);
      const supabase = await createClient();

      let updatedCount = 0;

      for (const trackingInfo of trackingInfoList) {
        // 查找对应的订单
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', integration.user_id)
          .not('shipping_info', 'is', null);

        if (!orders) continue;

        for (const order of orders) {
          const shippingInfo = order.shipping_info as unknown as ShippingInfo;
          if (shippingInfo?.tracking_number === trackingInfo.tracking_number) {
            // 更新物流信息
            const updatedShippingInfo: ShippingInfo = {
              ...shippingInfo,
              status: trackingInfo.status,
              estimated_delivery: trackingInfo.estimated_delivery,
            };

            await supabase
              .from('orders')
              .update({
                shipping_info: updatedShippingInfo as unknown as Record<string, unknown>,
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            updatedCount++;
          }
        }
      }

      Logger.info('17track sync completed', {
        integrationId: integration.id,
        updatedCount,
      });

      return updatedCount;
    } catch (error) {
      Logger.error('Failed to update tracking info with 17track', error as Error, {
        integrationId: integration.id,
      });
      throw error;
    }
  }

  /**
   * 更新物流追踪信息（使用ShipStation）
   */
  static async updateTrackingInfoShipStation(
    integration: Integration
  ): Promise<number> {
    try {
      Logger.info('Starting ShipStation tracking sync', {
        integrationId: integration.id,
      });

      const credentials = integration.credentials as {
        api_key: string;
        api_secret: string;
      };
      const shipStationClient = new ShipStationClient({
        api_key: credentials.api_key,
        api_secret: credentials.api_secret,
      });

      // 获取最近的物流信息
      const shipments = await shipStationClient.getShipments({
        pageSize: 100,
      });

      const supabase = await createClient();
      let updatedCount = 0;

      for (const shipment of shipments) {
        // 查找对应的订单
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', integration.user_id)
          .eq('external_order_id', shipment.orderId.toString());

        if (!orders || orders.length === 0) continue;

        const shippingInfo = shipStationClient.convertToShippingInfo(shipment);

        for (const order of orders) {
          await supabase
            .from('orders')
            .update({
              shipping_info: shippingInfo as unknown as Record<string, unknown>,
              status: 'shipped',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          updatedCount++;
        }
      }

      Logger.info('ShipStation tracking sync completed', {
        integrationId: integration.id,
        updatedCount,
      });

      return updatedCount;
    } catch (error) {
      Logger.error('Failed to update tracking info with ShipStation', error as Error, {
        integrationId: integration.id,
      });
      throw error;
    }
  }

  /**
   * 执行完整的供应链数据同步
   */
  static async syncAll(userId: string): Promise<{
    orders: number;
    inventory: number;
    tracking: number;
  }> {
    try {
      Logger.info('Starting full supply chain sync', { userId });

      const supabase = await createClient();

      // 获取所有供应链相关的集成
      const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('service_type', 'supply_chain')
        .eq('status', 'active');

      if (!integrations || integrations.length === 0) {
        Logger.info('No active supply chain integrations found', { userId });
        return { orders: 0, inventory: 0, tracking: 0 };
      }

      let totalOrders = 0;
      let totalInventory = 0;
      let totalTracking = 0;

      for (const integration of integrations) {
        if (integration.service_name === 'shopify') {
          totalOrders += await this.syncShopifyOrders(integration);
          totalInventory += await this.syncShopifyInventory(integration);
        } else if (integration.service_name === '17track') {
          // 获取所有需要追踪的订单
          const { data: orders } = await supabase
            .from('orders')
            .select('shipping_info')
            .eq('user_id', userId)
            .not('shipping_info', 'is', null);

          if (orders) {
            const trackingNumbers = orders
              .map((o) => (o.shipping_info as unknown as ShippingInfo)?.tracking_number)
              .filter(Boolean) as string[];

            if (trackingNumbers.length > 0) {
              totalTracking += await this.updateTrackingInfo17track(
                integration,
                trackingNumbers
              );
            }
          }
        } else if (integration.service_name === 'shipstation') {
          totalTracking += await this.updateTrackingInfoShipStation(integration);
        }
      }

      Logger.info('Full supply chain sync completed', {
        userId,
        totalOrders,
        totalInventory,
        totalTracking,
      });

      return {
        orders: totalOrders,
        inventory: totalInventory,
        tracking: totalTracking,
      };
    } catch (error) {
      Logger.error('Failed to sync supply chain data', error as Error, { userId });
      throw error;
    }
  }
}
