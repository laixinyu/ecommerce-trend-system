/**
 * 库存管理器
 * 提供库存计算、预警和分析功能
 */

import { createClient } from '@/lib/supabase/server';
import { Logger } from '@/lib/utils/logger';
import type {
  InventoryItem,
  Sale,
  InventoryAlert,
  InventoryMetrics,
} from '@/types/supply-chain';

export class InventoryManager {
  /**
   * 计算再订购点
   * 再订购点 = (日销量 × 补货周期) + 安全库存
   */
  static calculateReorderPoint(
    item: InventoryItem,
    salesHistory: Sale[],
    leadTimeDays: number = 14,
    safetyFactor: number = 1.5
  ): number {
    try {
      // 计算平均日销量
      const avgDailySales = this.calculateAvgDailySales(salesHistory, item.sku);

      if (avgDailySales === 0) {
        // 如果没有销售历史，使用默认值
        return 10;
      }

      // 安全库存 = 日销量 × 安全系数
      const safetyStock = Math.ceil(avgDailySales * safetyFactor);

      // 再订购点 = (日销量 × 补货周期) + 安全库存
      const reorderPoint = Math.ceil(avgDailySales * leadTimeDays + safetyStock);

      Logger.info('Calculated reorder point', {
        sku: item.sku,
        avgDailySales,
        leadTimeDays,
        safetyStock,
        reorderPoint,
      });

      return reorderPoint;
    } catch (error) {
      Logger.error('Failed to calculate reorder point', error as Error, {
        sku: item.sku,
      });
      return 10; // 返回默认值
    }
  }

  /**
   * 计算平均日销量
   */
  static calculateAvgDailySales(salesHistory: Sale[], sku?: string): number {
    if (salesHistory.length === 0) return 0;

    // 如果指定了SKU，只计算该SKU的销量
    const relevantSales = sku
      ? salesHistory.filter((s) => s.sku === sku)
      : salesHistory;

    if (relevantSales.length === 0) return 0;

    // 计算总销量
    const totalQuantity = relevantSales.reduce((sum, sale) => sum + sale.quantity, 0);

    // 计算时间跨度（天数）
    const dates = relevantSales.map((s) => new Date(s.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daysDiff = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));

    return totalQuantity / daysDiff;
  }

  /**
   * 计算建议订购量
   * 基于经济订购量(EOQ)模型
   */
  static calculateReorderQuantity(
    item: InventoryItem,
    salesHistory: Sale[],
    orderingCost: number = 50,
    holdingCostRate: number = 0.2
  ): number {
    try {
      const annualDemand = this.calculateAvgDailySales(salesHistory, item.sku) * 365;

      if (annualDemand === 0 || !item.unit_cost) {
        return 50; // 默认订购量
      }

      const holdingCost = item.unit_cost * holdingCostRate;

      // EOQ = sqrt((2 × 年需求量 × 订购成本) / 单位持有成本)
      const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);

      return Math.ceil(eoq);
    } catch (error) {
      Logger.error('Failed to calculate reorder quantity', error as Error, {
        sku: item.sku,
      });
      return 50;
    }
  }

  /**
   * 识别低库存商品
   */
  static async identifyLowStockItems(userId: string): Promise<InventoryItem[]> {
    try {
      const supabase = await createClient();

      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!items) return [];

      // 筛选低库存商品
      const lowStockItems = items.filter((item) => {
        const availableStock = item.quantity_on_hand + item.quantity_in_transit;
        const reorderPoint = item.reorder_point || 0;
        return availableStock <= reorderPoint;
      });

      Logger.info('Identified low stock items', {
        userId,
        count: lowStockItems.length,
      });

      return lowStockItems;
    } catch (error) {
      Logger.error('Failed to identify low stock items', error as Error, { userId });
      throw error;
    }
  }

  /**
   * 生成库存预警
   */
  static async generateInventoryAlerts(userId: string): Promise<InventoryAlert[]> {
    try {
      const supabase = await createClient();

      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!items) return [];

      const alerts: InventoryAlert[] = [];

      for (const item of items) {
        const availableStock = item.quantity_on_hand + item.quantity_in_transit;
        const reorderPoint = item.reorder_point || 0;

        if (availableStock === 0) {
          // 缺货
          alerts.push({
            item,
            alert_type: 'out_of_stock',
            message: `${item.product_name || item.sku} 已缺货`,
            severity: 'critical',
          });
        } else if (availableStock <= reorderPoint * 0.5) {
          // 严重低库存
          alerts.push({
            item,
            alert_type: 'low_stock',
            message: `${item.product_name || item.sku} 库存严重不足 (${availableStock} 件)`,
            severity: 'critical',
          });
        } else if (availableStock <= reorderPoint) {
          // 需要补货
          alerts.push({
            item,
            alert_type: 'reorder_needed',
            message: `${item.product_name || item.sku} 需要补货 (当前: ${availableStock}, 再订购点: ${reorderPoint})`,
            severity: 'warning',
          });
        }
      }

      Logger.info('Generated inventory alerts', {
        userId,
        alertCount: alerts.length,
      });

      return alerts;
    } catch (error) {
      Logger.error('Failed to generate inventory alerts', error as Error, { userId });
      throw error;
    }
  }

  /**
   * 计算库存周转率
   * 周转率 = 销售成本 / 平均库存价值
   */
  static calculateTurnoverRate(
    item: InventoryItem,
    salesHistory: Sale[]
  ): number {
    try {
      // 计算销售成本
      const relevantSales = salesHistory.filter((s) => s.sku === item.sku);
      const totalSold = relevantSales.reduce((sum, s) => sum + s.quantity, 0);
      const costOfGoodsSold = totalSold * (item.unit_cost || 0);

      // 计算平均库存价值
      const avgInventory = item.quantity_on_hand;
      const avgInventoryValue = avgInventory * (item.unit_cost || 0);

      if (avgInventoryValue === 0) return 0;

      // 周转率
      const turnoverRate = costOfGoodsSold / avgInventoryValue;

      return Math.round(turnoverRate * 100) / 100;
    } catch (error) {
      Logger.error('Failed to calculate turnover rate', error as Error, {
        sku: item.sku,
      });
      return 0;
    }
  }

  /**
   * 计算库存天数
   * 库存天数 = 365 / 周转率
   */
  static calculateDaysOfInventory(turnoverRate: number): number {
    if (turnoverRate === 0) return 0;
    return Math.round(365 / turnoverRate);
  }

  /**
   * 获取库存指标
   */
  static async getInventoryMetrics(userId: string): Promise<InventoryMetrics> {
    try {
      const supabase = await createClient();

      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!items) {
        return {
          total_items: 0,
          total_value: 0,
          low_stock_items: 0,
          out_of_stock_items: 0,
          average_turnover_rate: 0,
        };
      }

      // 计算总库存价值
      const totalValue = items.reduce(
        (sum, item) => sum + item.quantity_on_hand * (item.unit_cost || 0),
        0
      );

      // 统计低库存和缺货商品
      let lowStockCount = 0;
      let outOfStockCount = 0;

      for (const item of items) {
        const availableStock = item.quantity_on_hand + item.quantity_in_transit;
        const reorderPoint = item.reorder_point || 0;

        if (availableStock === 0) {
          outOfStockCount++;
        } else if (availableStock <= reorderPoint) {
          lowStockCount++;
        }
      }

      // 获取销售历史计算平均周转率
      const { data: orders } = await supabase
        .from('orders')
        .select('items, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      const salesHistory: Sale[] = [];
      if (orders) {
        for (const order of orders) {
          const items = order.items as unknown as Array<{ sku: string; quantity: number; unit_price: number }>;
          if (items) {
            for (const item of items) {
              salesHistory.push({
                date: order.created_at,
                sku: item.sku,
                quantity: item.quantity,
                revenue: item.quantity * item.unit_price,
              });
            }
          }
        }
      }

      // 计算平均周转率
      let totalTurnoverRate = 0;
      let itemsWithTurnover = 0;

      for (const item of items) {
        const turnoverRate = this.calculateTurnoverRate(item, salesHistory);
        if (turnoverRate > 0) {
          totalTurnoverRate += turnoverRate;
          itemsWithTurnover++;
        }
      }

      const avgTurnoverRate =
        itemsWithTurnover > 0 ? totalTurnoverRate / itemsWithTurnover : 0;

      return {
        total_items: items.length,
        total_value: Math.round(totalValue * 100) / 100,
        low_stock_items: lowStockCount,
        out_of_stock_items: outOfStockCount,
        average_turnover_rate: Math.round(avgTurnoverRate * 100) / 100,
      };
    } catch (error) {
      Logger.error('Failed to get inventory metrics', error as Error, { userId });
      throw error;
    }
  }

  /**
   * 批量更新再订购点
   */
  static async batchUpdateReorderPoints(
    userId: string,
    leadTimeDays: number = 14
  ): Promise<number> {
    try {
      const supabase = await createClient();

      // 获取所有库存项
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);

      if (itemsError) throw itemsError;
      if (!items) return 0;

      // 获取销售历史
      const { data: orders } = await supabase
        .from('orders')
        .select('items, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      const salesHistory: Sale[] = [];
      if (orders) {
        for (const order of orders) {
          const orderItems = order.items as unknown as Array<{ sku: string; quantity: number; unit_price: number }>;
          if (orderItems) {
            for (const item of orderItems) {
              salesHistory.push({
                date: order.created_at,
                sku: item.sku,
                quantity: item.quantity,
                revenue: item.quantity * item.unit_price,
              });
            }
          }
        }
      }

      let updatedCount = 0;

      // 更新每个库存项的再订购点
      for (const item of items) {
        const reorderPoint = this.calculateReorderPoint(
          item,
          salesHistory,
          leadTimeDays
        );
        const reorderQuantity = this.calculateReorderQuantity(item, salesHistory);

        await supabase
          .from('inventory_items')
          .update({
            reorder_point: reorderPoint,
            reorder_quantity: reorderQuantity,
          })
          .eq('id', item.id);

        updatedCount++;
      }

      Logger.info('Batch updated reorder points', {
        userId,
        updatedCount,
      });

      return updatedCount;
    } catch (error) {
      Logger.error('Failed to batch update reorder points', error as Error, { userId });
      throw error;
    }
  }
}
