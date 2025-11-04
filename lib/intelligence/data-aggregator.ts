import { createClient } from '@/lib/supabase/server';
import { AggregatedMetrics, DataSource } from '@/types/intelligence';

export class DataAggregator {
  /**
   * Aggregate metrics from all modules
   */
  static async aggregateAllMetrics(userId: string): Promise<AggregatedMetrics> {
    const supabase = await createClient();

    const [marketing, growth, content, supplyChain, products] = await Promise.all([
      this.aggregateMarketingMetrics(userId, supabase),
      this.aggregateGrowthMetrics(userId, supabase),
      this.aggregateContentMetrics(userId, supabase),
      this.aggregateSupplyChainMetrics(userId, supabase),
      this.aggregateProductMetrics(userId, supabase),
    ]);

    return {
      marketing,
      growth,
      content,
      supply_chain: supplyChain,
      products,
    };
  }

  /**
   * Fetch data from a specific data source
   */
  static async fetchDataFromSource(dataSource: DataSource, userId: string): Promise<any> {
    const supabase = await createClient();

    switch (dataSource.module) {
      case 'marketing':
        return this.fetchMarketingData(dataSource, userId, supabase);
      case 'growth':
        return this.fetchGrowthData(dataSource, userId, supabase);
      case 'content':
        return this.fetchContentData(dataSource, userId, supabase);
      case 'supply-chain':
        return this.fetchSupplyChainData(dataSource, userId, supabase);
      case 'products':
        return this.fetchProductData(dataSource, userId, supabase);
      default:
        throw new Error(`Unknown module: ${dataSource.module}`);
    }
  }

  private static async aggregateMarketingMetrics(userId: string, supabase: any) {
    try {
      // Get all campaigns
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('*, integration:integrations!inner(user_id)')
        .eq('integration.user_id', userId)
        .eq('status', 'active');

      if (!campaigns || campaigns.length === 0) {
        return {
          total_spend: 0,
          total_revenue: 0,
          roas: 0,
          active_campaigns: 0,
        };
      }

      const totalSpend = campaigns.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0);
      const totalRevenue = campaigns.reduce((sum, c) => {
        const conversions = c.metrics?.conversions || 0;
        const avgOrderValue = c.metrics?.average_order_value || 0;
        return sum + (conversions * avgOrderValue);
      }, 0);

      return {
        total_spend: totalSpend,
        total_revenue: totalRevenue,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        active_campaigns: campaigns.length,
      };
    } catch (error) {
      console.error('Error aggregating marketing metrics:', error);
      return {
        total_spend: 0,
        total_revenue: 0,
        roas: 0,
        active_campaigns: 0,
      };
    }
  }

  private static async aggregateGrowthMetrics(userId: string, supabase: any) {
    try {
      const { data: customers } = await supabase
        .from('crm_customers')
        .select('*')
        .eq('user_id', userId);

      if (!customers || customers.length === 0) {
        return {
          total_customers: 0,
          active_customers: 0,
          churn_rate: 0,
          avg_ltv: 0,
        };
      }

      const activeCustomers = customers.filter(c => c.segment === 'active' || c.segment === 'vip');
      const totalLtv = customers.reduce((sum, c) => sum + (c.ltv || 0), 0);
      const lostCustomers = customers.filter(c => c.segment === 'lost');

      return {
        total_customers: customers.length,
        active_customers: activeCustomers.length,
        churn_rate: customers.length > 0 ? (lostCustomers.length / customers.length) * 100 : 0,
        avg_ltv: customers.length > 0 ? totalLtv / customers.length : 0,
      };
    } catch (error) {
      console.error('Error aggregating growth metrics:', error);
      return {
        total_customers: 0,
        active_customers: 0,
        churn_rate: 0,
        avg_ltv: 0,
      };
    }
  }

  private static async aggregateContentMetrics(userId: string, supabase: any) {
    try {
      const { data: assets } = await supabase
        .from('content_assets')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (!assets || assets.length === 0) {
        return {
          total_assets: 0,
          total_engagement: 0,
          avg_engagement_rate: 0,
          top_platform: 'N/A',
        };
      }

      const totalEngagement = assets.reduce((sum, a) => {
        const metrics = a.metrics || {};
        return sum + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
      }, 0);

      const avgEngagementRate = assets.reduce((sum, a) => {
        return sum + (a.metrics?.engagement_rate || 0);
      }, 0) / assets.length;

      // Find top platform
      const platformCounts: Record<string, number> = {};
      assets.forEach(a => {
        if (a.platform) {
          platformCounts[a.platform] = (platformCounts[a.platform] || 0) + 1;
        }
      });
      const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        total_assets: assets.length,
        total_engagement: totalEngagement,
        avg_engagement_rate: avgEngagementRate,
        top_platform: topPlatform,
      };
    } catch (error) {
      console.error('Error aggregating content metrics:', error);
      return {
        total_assets: 0,
        total_engagement: 0,
        avg_engagement_rate: 0,
        top_platform: 'N/A',
      };
    }
  }

  private static async aggregateSupplyChainMetrics(userId: string, supabase: any) {
    try {
      const [inventoryResult, ordersResult] = await Promise.all([
        supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending'),
      ]);

      const inventory = inventoryResult.data || [];
      const orders = ordersResult.data || [];

      const totalInventoryValue = inventory.reduce((sum, item) => {
        return sum + (item.quantity_on_hand * item.unit_cost || 0);
      }, 0);

      const lowStockItems = inventory.filter(item => {
        const available = item.quantity_on_hand + (item.quantity_in_transit || 0);
        return available <= (item.reorder_point || 0);
      });

      // Calculate average fulfillment time from completed orders
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('created_at, updated_at')
        .eq('user_id', userId)
        .eq('status', 'delivered')
        .limit(100);

      let avgFulfillmentTime = 0;
      if (completedOrders && completedOrders.length > 0) {
        const totalTime = completedOrders.reduce((sum, order) => {
          const created = new Date(order.created_at).getTime();
          const delivered = new Date(order.updated_at).getTime();
          return sum + (delivered - created);
        }, 0);
        avgFulfillmentTime = totalTime / completedOrders.length / (1000 * 60 * 60 * 24); // Convert to days
      }

      return {
        total_inventory_value: totalInventoryValue,
        low_stock_items: lowStockItems.length,
        pending_orders: orders.length,
        avg_fulfillment_time: avgFulfillmentTime,
      };
    } catch (error) {
      console.error('Error aggregating supply chain metrics:', error);
      return {
        total_inventory_value: 0,
        low_stock_items: 0,
        pending_orders: 0,
        avg_fulfillment_time: 0,
      };
    }
  }

  private static async aggregateProductMetrics(userId: string, supabase: any) {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);

      if (!products || products.length === 0) {
        return {
          total_products: 0,
          trending_products: 0,
          avg_rating: 0,
        };
      }

      const trendingProducts = products.filter(p => p.trend_score && p.trend_score > 70);
      const totalRating = products.reduce((sum, p) => sum + (p.rating || 0), 0);

      return {
        total_products: products.length,
        trending_products: trendingProducts.length,
        avg_rating: products.length > 0 ? totalRating / products.length : 0,
      };
    } catch (error) {
      console.error('Error aggregating product metrics:', error);
      return {
        total_products: 0,
        trending_products: 0,
        avg_rating: 0,
      };
    }
  }

  private static async fetchMarketingData(dataSource: DataSource, userId: string, supabase: any) {
    const endpoint = dataSource.endpoint;
    
    if (endpoint === 'campaigns') {
      const { data } = await supabase
        .from('ad_campaigns')
        .select('*, integration:integrations!inner(user_id)')
        .eq('integration.user_id', userId);
      return data || [];
    }
    
    return [];
  }

  private static async fetchGrowthData(dataSource: DataSource, userId: string, supabase: any) {
    const endpoint = dataSource.endpoint;
    
    if (endpoint === 'customers') {
      const { data } = await supabase
        .from('crm_customers')
        .select('*')
        .eq('user_id', userId);
      return data || [];
    }
    
    return [];
  }

  private static async fetchContentData(dataSource: DataSource, userId: string, supabase: any) {
    const endpoint = dataSource.endpoint;
    
    if (endpoint === 'assets') {
      const { data } = await supabase
        .from('content_assets')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);
      return data || [];
    }
    
    return [];
  }

  private static async fetchSupplyChainData(dataSource: DataSource, userId: string, supabase: any) {
    const endpoint = dataSource.endpoint;
    
    if (endpoint === 'inventory') {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);
      return data || [];
    }
    
    if (endpoint === 'orders') {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);
      return data || [];
    }
    
    return [];
  }

  private static async fetchProductData(dataSource: DataSource, userId: string, supabase: any) {
    const endpoint = dataSource.endpoint;
    
    if (endpoint === 'products') {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
      return data || [];
    }
    
    return [];
  }
}
