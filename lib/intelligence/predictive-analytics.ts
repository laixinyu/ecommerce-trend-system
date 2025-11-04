import { createClient } from '@/lib/supabase/server';
import {
  Prediction,
  PredictionPoint,
  PricingSuggestion,
  InventoryForecast,
} from '@/types/intelligence';

interface Sale {
  date: string;
  quantity: number;
  revenue: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sales_history?: Sale[];
}

export class PredictiveAnalytics {
  private supabase: any;
  private userId: string;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Predict sales for a product
   */
  async predictSales(productId: string, days: number = 30): Promise<Prediction> {
    // Fetch historical sales data
    const { data: orders } = await this.supabase
      .from('orders')
      .select('created_at, items')
      .eq('user_id', this.userId)
      .eq('status', 'delivered')
      .order('created_at', { ascending: true });

    // Extract sales for this product
    const salesData: Sale[] = [];
    orders?.forEach((order: any) => {
      const items = order.items || [];
      items.forEach((item: any) => {
        if (item.product_id === productId) {
          salesData.push({
            date: order.created_at,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      });
    });

    if (salesData.length < 7) {
      throw new Error('Insufficient historical data for prediction (minimum 7 days required)');
    }

    // Calculate trend and seasonality
    const trend = this.calculateTrend(salesData);
    const seasonality = this.calculateSeasonality(salesData);

    // Generate predictions
    const predictions: PredictionPoint[] = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);

      const trendValue = trend.slope * (salesData.length + i) + trend.intercept;
      const seasonalFactor = seasonality[i % 7];
      const predicted = Math.max(0, trendValue * seasonalFactor);

      // Calculate confidence bounds (simple approach)
      const stdDev = this.calculateStdDev(salesData.map(s => s.quantity));
      const lowerBound = Math.max(0, predicted - stdDev * 1.96);
      const upperBound = predicted + stdDev * 1.96;

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.round(predicted * 100) / 100,
        lower_bound: Math.round(lowerBound * 100) / 100,
        upper_bound: Math.round(upperBound * 100) / 100,
      });
    }

    const confidence = this.calculateConfidence(salesData);

    const prediction: Prediction = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      type: 'sales',
      target: productId,
      predictions,
      confidence,
      model: 'linear_trend_seasonal',
      created_at: new Date().toISOString(),
    };

    // Save prediction
    await this.supabase.from('predictions').insert(prediction);

    return prediction;
  }

  /**
   * Suggest optimal pricing for a product
   */
  async suggestOptimalPrice(productId: string): Promise<PricingSuggestion> {
    // Fetch product
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', this.userId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    // Fetch competitor prices (from products with similar categories)
    const { data: competitors } = await this.supabase
      .from('products')
      .select('price')
      .eq('category', product.category)
      .neq('id', productId)
      .limit(10);

    const competitorPrices = competitors?.map((c: any) => c.price) || [];
    
    if (competitorPrices.length === 0) {
      // No competitors, suggest based on cost + margin
      const suggestedPrice = product.price * 1.05; // 5% increase
      return {
        product_id: productId,
        current_price: product.price,
        suggested_price: Math.round(suggestedPrice * 100) / 100,
        expected_impact: {
          sales_change: -2, // Estimated 2% decrease in sales
          revenue_change: 3, // Estimated 3% increase in revenue
        },
        reasoning: '基于当前价格建议小幅提价，无竞品数据参考',
      };
    }

    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const demandElasticity = this.estimateDemandElasticity(product);

    // Price optimization logic
    let suggestedPrice: number;
    let reasoning: string;
    let salesChange: number;
    let revenueChange: number;

    if (product.price > avgCompetitorPrice * 1.1) {
      // Current price is too high
      suggestedPrice = avgCompetitorPrice * 1.05;
      reasoning = '当前价格高于竞品平均价，建议降价以提高竞争力';
      salesChange = 15; // Estimated 15% increase in sales
      revenueChange = 10; // Estimated 10% increase in revenue
    } else if (product.price < avgCompetitorPrice * 0.9) {
      // Current price is too low
      suggestedPrice = avgCompetitorPrice * 0.95;
      reasoning = '当前价格低于竞品平均价，有提价空间';
      salesChange = -5; // Estimated 5% decrease in sales
      revenueChange = 8; // Estimated 8% increase in revenue
    } else {
      // Price is competitive
      if (demandElasticity > 1.5) {
        // High elasticity - keep price competitive
        suggestedPrice = product.price * 0.98;
        reasoning = '需求弹性高，建议保持价格竞争力';
        salesChange = 3;
        revenueChange = 1;
      } else {
        // Low elasticity - can increase price
        suggestedPrice = product.price * 1.03;
        reasoning = '需求弹性低，可适当提价';
        salesChange = -1;
        revenueChange = 2;
      }
    }

    return {
      product_id: productId,
      current_price: product.price,
      suggested_price: Math.round(suggestedPrice * 100) / 100,
      expected_impact: {
        sales_change: salesChange,
        revenue_change: revenueChange,
      },
      reasoning,
    };
  }

  /**
   * Forecast inventory demand
   */
  async forecastInventoryDemand(sku: string, days: number = 30): Promise<InventoryForecast> {
    // Fetch inventory item
    const { data: item } = await this.supabase
      .from('inventory_items')
      .select('*')
      .eq('sku', sku)
      .eq('user_id', this.userId)
      .single();

    if (!item) {
      throw new Error('Inventory item not found');
    }

    // Fetch historical sales
    const { data: orders } = await this.supabase
      .from('orders')
      .select('created_at, items')
      .eq('user_id', this.userId)
      .eq('status', 'delivered')
      .order('created_at', { ascending: true });

    // Extract sales for this SKU
    const salesData: Sale[] = [];
    orders?.forEach((order: any) => {
      const items = order.items || [];
      items.forEach((orderItem: any) => {
        if (orderItem.sku === sku) {
          salesData.push({
            date: order.created_at,
            quantity: orderItem.quantity,
            revenue: 0,
          });
        }
      });
    });

    // Predict demand
    const trend = this.calculateTrend(salesData);
    const seasonality = this.calculateSeasonality(salesData);

    const predictions: PredictionPoint[] = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);

      const trendValue = trend.slope * (salesData.length + i) + trend.intercept;
      const seasonalFactor = seasonality[i % 7];
      const predicted = Math.max(0, trendValue * seasonalFactor);

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.round(predicted * 100) / 100,
      });
    }

    // Calculate total predicted demand
    const totalDemand = predictions.reduce((sum, p) => sum + p.value, 0);
    const currentStock = item.quantity_on_hand + (item.quantity_in_transit || 0);

    // Determine reorder recommendation
    let reorderDate: string;
    let reorderQuantity: number;
    let urgency: 'low' | 'medium' | 'high';

    if (currentStock < totalDemand * 0.3) {
      // Critical - need to reorder immediately
      reorderDate = today.toISOString().split('T')[0];
      reorderQuantity = Math.ceil(totalDemand * 1.5);
      urgency = 'high';
    } else if (currentStock < totalDemand * 0.6) {
      // Medium - reorder soon
      const daysUntilReorder = 7;
      const reorderDateObj = new Date(today);
      reorderDateObj.setDate(reorderDateObj.getDate() + daysUntilReorder);
      reorderDate = reorderDateObj.toISOString().split('T')[0];
      reorderQuantity = Math.ceil(totalDemand * 1.2);
      urgency = 'medium';
    } else {
      // Low - stock is sufficient
      const daysUntilReorder = 14;
      const reorderDateObj = new Date(today);
      reorderDateObj.setDate(reorderDateObj.getDate() + daysUntilReorder);
      reorderDate = reorderDateObj.toISOString().split('T')[0];
      reorderQuantity = Math.ceil(totalDemand);
      urgency = 'low';
    }

    return {
      sku,
      current_stock: currentStock,
      predicted_demand: predictions,
      reorder_recommendation: {
        date: reorderDate,
        quantity: reorderQuantity,
        urgency,
      },
    };
  }

  /**
   * Predict trend for a category or market
   */
  async predictTrend(category: string, days: number = 30): Promise<Prediction> {
    // Fetch products in category
    const { data: products } = await this.supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('user_id', this.userId);

    if (!products || products.length === 0) {
      throw new Error('No products found in category');
    }

    // Aggregate trend scores over time
    const trendData = products.map((p: any) => ({
      date: p.created_at,
      value: p.trend_score || 0,
    }));

    const trend = this.calculateTrend(trendData);
    const predictions: PredictionPoint[] = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);

      const predicted = trend.slope * (trendData.length + i) + trend.intercept;

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, Math.min(100, predicted)), // Clamp between 0-100
      });
    }

    const confidence = this.calculateConfidence(trendData);

    const prediction: Prediction = {
      id: crypto.randomUUID(),
      user_id: this.userId,
      type: 'trend',
      target: category,
      predictions,
      confidence,
      model: 'linear_trend',
      created_at: new Date().toISOString(),
    };

    await this.supabase.from('predictions').insert(prediction);

    return prediction;
  }

  /**
   * Helper: Calculate linear trend
   */
  private calculateTrend(data: Array<{ date: string; quantity?: number; value?: number }>): {
    slope: number;
    intercept: number;
  } {
    const values = data.map(d => d.quantity || d.value || 0);
    const n = values.length;

    if (n < 2) {
      return { slope: 0, intercept: values[0] || 0 };
    }

    const xValues = Array.from({ length: n }, (_, i) => i);
    const xMean = xValues.reduce((a, b) => a + b, 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (values[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    return { slope, intercept };
  }

  /**
   * Helper: Calculate seasonality factors (day of week)
   */
  private calculateSeasonality(data: Sale[]): number[] {
    const dayTotals = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);

    data.forEach(sale => {
      const dayOfWeek = new Date(sale.date).getDay();
      dayTotals[dayOfWeek] += sale.quantity;
      dayCounts[dayOfWeek]++;
    });

    const avgPerDay = dayTotals.map((total, i) => 
      dayCounts[i] > 0 ? total / dayCounts[i] : 0
    );

    const overallAvg = avgPerDay.reduce((a, b) => a + b, 0) / 7;

    return avgPerDay.map(avg => 
      overallAvg > 0 ? avg / overallAvg : 1
    );
  }

  /**
   * Helper: Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Helper: Calculate prediction confidence
   */
  private calculateConfidence(data: any[]): number {
    // Simple confidence based on data quantity and variance
    const dataPoints = data.length;
    const values = data.map(d => d.quantity || d.value || 0);
    const stdDev = this.calculateStdDev(values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const cv = mean > 0 ? stdDev / mean : 1; // Coefficient of variation

    // More data points = higher confidence
    // Lower variance = higher confidence
    const dataConfidence = Math.min(dataPoints / 30, 1); // Max at 30 days
    const varianceConfidence = Math.max(0, 1 - cv);

    return Math.round((dataConfidence * 0.5 + varianceConfidence * 0.5) * 100);
  }

  /**
   * Helper: Estimate demand elasticity
   */
  private estimateDemandElasticity(product: any): number {
    // Simplified elasticity estimation
    // In reality, this would require historical price and sales data
    
    // Assume higher-priced items have lower elasticity
    if (product.price > 100) return 0.8;
    if (product.price > 50) return 1.2;
    return 1.8;
  }
}
