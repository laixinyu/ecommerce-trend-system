// RFM分析引擎
import { Customer, RFMScore, CustomerSegment } from '@/types/crm';

/**
 * RFM分析引擎
 * 实现客户价值分析和自动分层
 */
export class RFMAnalysis {
  /**
   * 计算RFM评分
   * @param customer 客户数据
   * @param allCustomers 所有客户数据（用于相对评分）
   */
  calculateRFMScore(customer: Customer, allCustomers: Customer[]): RFMScore {
    const recency = this.calculateRecencyScore(customer);
    const frequency = this.calculateFrequencyScore(customer, allCustomers);
    const monetary = this.calculateMonetaryScore(customer, allCustomers);

    return {
      recency,
      frequency,
      monetary,
      total: recency + frequency + monetary,
    };
  }

  /**
   * 计算Recency评分（最近购买时间）
   * 评分规则：
   * - 5分: 30天内购买
   * - 4分: 31-60天
   * - 3分: 61-90天
   * - 2分: 91-180天
   * - 1分: 180天以上
   */
  private calculateRecencyScore(customer: Customer): number {
    if (!customer.last_purchase_at) {
      return 1;
    }

    const daysSinceLastPurchase = Math.floor(
      (Date.now() - new Date(customer.last_purchase_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastPurchase <= 30) return 5;
    if (daysSinceLastPurchase <= 60) return 4;
    if (daysSinceLastPurchase <= 90) return 3;
    if (daysSinceLastPurchase <= 180) return 2;
    return 1;
  }

  /**
   * 计算Frequency评分（购买频次）
   * 使用五分位数进行相对评分
   */
  private calculateFrequencyScore(
    customer: Customer,
    allCustomers: Customer[]
  ): number {
    const frequencies = allCustomers
      .map((c) => c.total_orders)
      .sort((a, b) => a - b);

    return this.getQuintileScore(customer.total_orders, frequencies);
  }

  /**
   * 计算Monetary评分（消费金额）
   * 使用五分位数进行相对评分
   */
  private calculateMonetaryScore(
    customer: Customer,
    allCustomers: Customer[]
  ): number {
    const monetaries = allCustomers
      .map((c) => c.total_spent)
      .sort((a, b) => a - b);

    return this.getQuintileScore(customer.total_spent, monetaries);
  }

  /**
   * 根据五分位数计算评分
   */
  private getQuintileScore(value: number, sortedValues: number[]): number {
    const length = sortedValues.length;
    if (length === 0) return 1;

    const q1 = sortedValues[Math.floor(length * 0.2)];
    const q2 = sortedValues[Math.floor(length * 0.4)];
    const q3 = sortedValues[Math.floor(length * 0.6)];
    const q4 = sortedValues[Math.floor(length * 0.8)];

    if (value >= q4) return 5;
    if (value >= q3) return 4;
    if (value >= q2) return 3;
    if (value >= q1) return 2;
    return 1;
  }

  /**
   * 根据RFM评分进行客户分层
   * 分层规则：
   * - VIP客户: R>=4, F>=4, M>=4
   * - 活跃客户: R>=3
   * - 流失风险: R<=2, F>=3
   * - 已流失: R=1
   * - 新客户: 其他
   */
  segmentCustomer(rfmScore: RFMScore): CustomerSegment {
    const { recency, frequency, monetary } = rfmScore;

    // VIP客户: 高频高额近期购买
    if (recency >= 4 && frequency >= 4 && monetary >= 4) {
      return 'vip';
    }

    // 活跃客户: 近期有购买
    if (recency >= 3) {
      return 'active';
    }

    // 流失风险: 曾经活跃但最近没购买
    if (recency <= 2 && frequency >= 3) {
      return 'at_risk';
    }

    // 已流失: 长时间未购买
    if (recency === 1) {
      return 'lost';
    }

    // 新客户
    return 'new';
  }

  /**
   * 批量计算所有客户的RFM评分和分层
   */
  async analyzeAllCustomers(customers: Customer[]): Promise<Customer[]> {
    return customers.map((customer) => {
      const rfmScore = this.calculateRFMScore(customer, customers);
      const segment = this.segmentCustomer(rfmScore);

      return {
        ...customer,
        rfm_score: rfmScore,
        segment,
      };
    });
  }

  /**
   * 获取分层统计
   */
  getSegmentStats(customers: Customer[]): Record<CustomerSegment, number> {
    const stats: Record<CustomerSegment, number> = {
      vip: 0,
      active: 0,
      at_risk: 0,
      lost: 0,
      new: 0,
    };

    customers.forEach((customer) => {
      stats[customer.segment]++;
    });

    return stats;
  }

  /**
   * 计算客户生命周期价值（LTV）
   * LTV = 平均订单价值 × 购买频率 × 客户生命周期
   */
  calculateLTV(customer: Customer): number {
    if (customer.total_orders === 0) {
      return 0;
    }

    // 平均订单价值
    const avgOrderValue = customer.total_spent / customer.total_orders;

    // 计算客户生命周期（天数）
    const lifespanDays = customer.first_purchase_at && customer.last_purchase_at
      ? Math.max(
          1,
          Math.floor(
            (new Date(customer.last_purchase_at).getTime() -
              new Date(customer.first_purchase_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 365; // 默认1年

    // 年化购买频率
    const annualFrequency = (customer.total_orders / lifespanDays) * 365;

    // 预测客户生命周期（年）
    // 根据RFM评分调整：高分客户预期生命周期更长
    const rfmScore = customer.rfm_score?.total || 9;
    const predictedLifespanYears = 1 + (rfmScore / 15) * 2; // 1-3年

    // LTV = 平均订单价值 × 年化频率 × 预测生命周期
    return avgOrderValue * annualFrequency * predictedLifespanYears;
  }

  /**
   * 生成客户画像
   */
  generateCustomerProfile(customer: Customer): {
    segment: CustomerSegment;
    rfm_score: RFMScore;
    ltv: number;
    avg_order_value: number;
    purchase_frequency: string;
    customer_age_days: number;
    risk_level: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const avgOrderValue =
      customer.total_orders > 0
        ? customer.total_spent / customer.total_orders
        : 0;

    const customerAgeDays = customer.first_purchase_at
      ? Math.floor(
          (Date.now() - new Date(customer.first_purchase_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const purchaseFrequency = this.getPurchaseFrequencyLabel(
      customer.total_orders,
      customerAgeDays
    );

    const riskLevel = this.assessRiskLevel(customer);
    const recommendations = this.generateRecommendations(customer);

    return {
      segment: customer.segment,
      rfm_score: customer.rfm_score,
      ltv: customer.ltv,
      avg_order_value: avgOrderValue,
      purchase_frequency: purchaseFrequency,
      customer_age_days: customerAgeDays,
      risk_level: riskLevel,
      recommendations,
    };
  }

  /**
   * 获取购买频率标签
   */
  private getPurchaseFrequencyLabel(
    totalOrders: number,
    customerAgeDays: number
  ): string {
    if (customerAgeDays === 0 || totalOrders === 0) {
      return '无购买';
    }

    const ordersPerMonth = (totalOrders / customerAgeDays) * 30;

    if (ordersPerMonth >= 2) return '高频';
    if (ordersPerMonth >= 0.5) return '中频';
    return '低频';
  }

  /**
   * 评估流失风险
   */
  private assessRiskLevel(customer: Customer): 'low' | 'medium' | 'high' {
    const recency = customer.rfm_score?.recency || 1;

    if (customer.segment === 'lost') return 'high';
    if (customer.segment === 'at_risk') return 'high';
    if (recency <= 2) return 'medium';
    return 'low';
  }

  /**
   * 生成营销建议
   */
  private generateRecommendations(customer: Customer): string[] {
    const recommendations: string[] = [];

    switch (customer.segment) {
      case 'vip':
        recommendations.push('提供VIP专属优惠和服务');
        recommendations.push('邀请参加高端活动');
        recommendations.push('优先获得新品试用');
        break;

      case 'active':
        recommendations.push('发送个性化产品推荐');
        recommendations.push('提供会员积分奖励');
        recommendations.push('鼓励推荐新客户');
        break;

      case 'at_risk':
        recommendations.push('发送挽回优惠券');
        recommendations.push('了解流失原因');
        recommendations.push('提供个性化关怀');
        break;

      case 'lost':
        recommendations.push('发送重新激活邮件');
        recommendations.push('提供大额折扣');
        recommendations.push('调研流失原因');
        break;

      case 'new':
        recommendations.push('发送欢迎邮件');
        recommendations.push('提供新客户优惠');
        recommendations.push('引导完成第二次购买');
        break;
    }

    return recommendations;
  }
}

export const rfmAnalysis = new RFMAnalysis();
