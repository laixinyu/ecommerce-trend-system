// A/B测试分析引擎
export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  traffic_percentage: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface ABTestResult {
  testId: string;
  testName: string;
  winner?: string;
  confidence: number;
  variants: Array<{
    id: string;
    name: string;
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
      ctr: number;
      conversionRate: number;
      revenuePerVisitor: number;
    };
    improvement: number; // 相对于对照组的提升百分比
    isControl: boolean;
  }>;
  recommendation: string;
}

/**
 * A/B测试分析引擎
 * 提供测试结果分析和统计显著性计算
 */
export class ABTestingAnalytics {
  /**
   * 分析A/B测试结果
   * @param test A/B测试数据
   */
  analyzeTestResults(test: ABTest): ABTestResult {
    if (test.variants.length < 2) {
      throw new Error('A/B test must have at least 2 variants');
    }

    // 假设第一个变体是对照组
    const controlVariant = test.variants[0];

    // 计算每个变体的指标
    const variantResults = test.variants.map((variant, index) => {
      const ctr =
        variant.impressions > 0
          ? (variant.clicks / variant.impressions) * 100
          : 0;
      const conversionRate =
        variant.clicks > 0 ? (variant.conversions / variant.clicks) * 100 : 0;
      const revenuePerVisitor =
        variant.impressions > 0 ? variant.revenue / variant.impressions : 0;

      // 计算相对于对照组的提升
      let improvement = 0;
      if (index > 0 && controlVariant.conversions > 0) {
        const controlConversionRate =
          controlVariant.clicks > 0
            ? (controlVariant.conversions / controlVariant.clicks) * 100
            : 0;
        improvement =
          controlConversionRate > 0
            ? ((conversionRate - controlConversionRate) /
                controlConversionRate) *
              100
            : 0;
      }

      return {
        id: variant.id,
        name: variant.name,
        metrics: {
          impressions: variant.impressions,
          clicks: variant.clicks,
          conversions: variant.conversions,
          revenue: variant.revenue,
          ctr,
          conversionRate,
          revenuePerVisitor,
        },
        improvement,
        isControl: index === 0,
      };
    });

    // 找出表现最好的变体
    const bestVariant = variantResults.reduce((best, current) =>
      current.metrics.conversionRate > best.metrics.conversionRate
        ? current
        : best
    );

    // 计算统计置信度（简化版本）
    const confidence = this.calculateConfidence(
      controlVariant,
      test.variants.find((v) => v.id === bestVariant.id)!
    );

    // 生成建议
    let recommendation = '';
    if (confidence >= 95) {
      recommendation = `变体 "${bestVariant.name}" 以 ${confidence.toFixed(1)}% 的置信度胜出，建议采用该变体。`;
    } else if (confidence >= 80) {
      recommendation = `变体 "${bestVariant.name}" 表现较好，但置信度 (${confidence.toFixed(1)}%) 不足，建议继续测试。`;
    } else {
      recommendation = `测试结果不明显，建议继续收集数据或调整测试设计。`;
    }

    return {
      testId: test.id,
      testName: test.name,
      winner: confidence >= 95 ? bestVariant.id : undefined,
      confidence,
      variants: variantResults,
      recommendation,
    };
  }

  /**
   * 计算统计置信度（简化版本）
   * 使用Z检验计算两个变体之间的统计显著性
   */
  private calculateConfidence(
    control: ABTestVariant,
    variant: ABTestVariant
  ): number {
    const p1 =
      control.clicks > 0 ? control.conversions / control.clicks : 0;
    const p2 =
      variant.clicks > 0 ? variant.conversions / variant.clicks : 0;
    const n1 = control.clicks;
    const n2 = variant.clicks;

    if (n1 === 0 || n2 === 0) {
      return 0;
    }

    // 合并转化率
    const pPool = (control.conversions + variant.conversions) / (n1 + n2);

    // 标准误差
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

    if (se === 0) {
      return 0;
    }

    // Z分数
    const z = Math.abs(p2 - p1) / se;

    // 转换为置信度百分比（简化）
    // 实际应该使用正态分布累积分布函数
    const confidence = Math.min(99.9, (1 - Math.exp(-z * z / 2)) * 100);

    return confidence;
  }

  /**
   * 计算所需样本量
   * @param baselineConversionRate 基准转化率
   * @param minimumDetectableEffect 最小可检测效应（百分比）
   * @param significance 显著性水平（默认0.05）
   * @param power 统计功效（默认0.8）
   */
  calculateRequiredSampleSize(
    baselineConversionRate: number,
    minimumDetectableEffect: number,
    significance: number = 0.05,
    power: number = 0.8
  ): number {
    // 简化的样本量计算
    // 实际应该使用更精确的统计公式
    const p1 = baselineConversionRate / 100;
    const p2 = p1 * (1 + minimumDetectableEffect / 100);

    const zAlpha = 1.96; // 对应95%置信度
    const zBeta = 0.84; // 对应80%功效

    const numerator =
      Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  /**
   * 检查测试是否可以结束
   * @param test A/B测试数据
   * @param minConfidence 最小置信度要求
   * @param minSampleSize 最小样本量要求
   */
  canEndTest(
    test: ABTest,
    minConfidence: number = 95,
    minSampleSize: number = 1000
  ): {
    canEnd: boolean;
    reason: string;
  } {
    // 检查样本量
    const totalImpressions = test.variants.reduce(
      (sum, v) => sum + v.impressions,
      0
    );
    if (totalImpressions < minSampleSize) {
      return {
        canEnd: false,
        reason: `样本量不足。当前: ${totalImpressions}, 需要: ${minSampleSize}`,
      };
    }

    // 分析结果
    const result = this.analyzeTestResults(test);

    // 检查置信度
    if (result.confidence < minConfidence) {
      return {
        canEnd: false,
        reason: `置信度不足。当前: ${result.confidence.toFixed(1)}%, 需要: ${minConfidence}%`,
      };
    }

    return {
      canEnd: true,
      reason: `测试可以结束。置信度: ${result.confidence.toFixed(1)}%, 样本量: ${totalImpressions}`,
    };
  }
}

// 导出单例实例
export const abTestingAnalytics = new ABTestingAnalytics();
