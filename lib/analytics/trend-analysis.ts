/**
 * 趋势分析工具函数
 */

import type { TrendHistory } from '@/types';

/**
 * 计算移动平均
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number = 7
): number[] {
  if (data.length < windowSize) {
    return data;
  }

  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      // 前面不足窗口大小的数据，使用累积平均
      const sum = data.slice(0, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / (i + 1));
    } else {
      // 计算窗口内的平均值
      const window = data.slice(i - windowSize + 1, i + 1);
      const sum = window.reduce((a, b) => a + b, 0);
      result.push(sum / windowSize);
    }
  }

  return result;
}

/**
 * 计算指数移动平均 (EMA)
 */
export function calculateEMA(data: number[], period: number = 12): number[] {
  if (data.length === 0) return [];

  const multiplier = 2 / (period + 1);
  const ema: number[] = [data[0]]; // 第一个值作为初始EMA

  for (let i = 1; i < data.length; i++) {
    const currentEMA = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * 计算同比增长率
 */
export function calculateYoYGrowth(
  current: number,
  lastYear: number
): number {
  if (lastYear === 0) return 0;
  return ((current - lastYear) / lastYear) * 100;
}

/**
 * 计算环比增长率
 */
export function calculateMoMGrowth(
  current: number,
  lastMonth: number
): number {
  if (lastMonth === 0) return 0;
  return ((current - lastMonth) / lastMonth) * 100;
}

/**
 * 批量计算同比环比数据
 */
export function calculateGrowthRates(history: TrendHistory[]): Array<{
  date: string;
  value: number;
  yoyGrowth: number | null;
  momGrowth: number | null;
}> {
  if (history.length === 0) return [];

  // 按日期排序
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.map((item, index) => {
    const value = item.searchVolume;

    // 计算环比（与上一条记录比较）
    const momGrowth =
      index > 0 ? calculateMoMGrowth(value, sorted[index - 1].searchVolume) : null;

    // 计算同比（与一年前的记录比较，假设每条记录间隔一天）
    const yearAgoIndex = index - 365;
    const yoyGrowth =
      yearAgoIndex >= 0
        ? calculateYoYGrowth(value, sorted[yearAgoIndex].searchVolume)
        : null;

    return {
      date: item.date,
      value,
      yoyGrowth,
      momGrowth,
    };
  });
}

/**
 * 季节性分解（简化版STL）
 */
export function decomposeSeasonality(
  data: number[],
  period: number = 7
): {
  trend: number[];
  seasonal: number[];
  residual: number[];
} {
  // 1. 计算趋势（使用移动平均）
  const trend = calculateMovingAverage(data, period);

  // 2. 去除趋势，得到季节性+残差
  const detrended = data.map((value, i) => value - trend[i]);

  // 3. 计算季节性成分（每个周期位置的平均值）
  const seasonal: number[] = new Array(data.length).fill(0);
  const seasonalAverages: number[] = new Array(period).fill(0);
  const seasonalCounts: number[] = new Array(period).fill(0);

  detrended.forEach((value, i) => {
    const seasonIndex = i % period;
    seasonalAverages[seasonIndex] += value;
    seasonalCounts[seasonIndex]++;
  });

  // 计算每个季节位置的平均值
  for (let i = 0; i < period; i++) {
    if (seasonalCounts[i] > 0) {
      seasonalAverages[i] /= seasonalCounts[i];
    }
  }

  // 将季节性成分应用到所有数据点
  data.forEach((_, i) => {
    seasonal[i] = seasonalAverages[i % period];
  });

  // 4. 计算残差
  const residual = data.map((value, i) => value - trend[i] - seasonal[i]);

  return { trend, seasonal, residual };
}

/**
 * 识别季节性商品
 */
export function identifySeasonalProduct(history: TrendHistory[]): {
  isSeasonal: boolean;
  seasonalityStrength: number;
  peakMonths: number[];
} {
  if (history.length < 30) {
    return {
      isSeasonal: false,
      seasonalityStrength: 0,
      peakMonths: [],
    };
  }

  const searchVolumes = history.map((h) => h.searchVolume);
  const { seasonal } = decomposeSeasonality(searchVolumes, 30); // 30天周期

  // 计算季节性强度（季节性成分的标准差）
  const seasonalMean = seasonal.reduce((a, b) => a + b, 0) / seasonal.length;
  const seasonalVariance =
    seasonal.reduce((sum, val) => sum + Math.pow(val - seasonalMean, 2), 0) /
    seasonal.length;
  const seasonalStdDev = Math.sqrt(seasonalVariance);

  // 计算原始数据的标准差
  const dataMean = searchVolumes.reduce((a, b) => a + b, 0) / searchVolumes.length;
  const dataVariance =
    searchVolumes.reduce((sum, val) => sum + Math.pow(val - dataMean, 2), 0) /
    searchVolumes.length;
  const dataStdDev = Math.sqrt(dataVariance);

  // 季节性强度 = 季节性标准差 / 数据标准差
  const seasonalityStrength = dataStdDev > 0 ? seasonalStdDev / dataStdDev : 0;

  // 识别峰值月份
  const monthlyAverages = new Map<number, { sum: number; count: number }>();

  history.forEach((item) => {
    const month = new Date(item.date).getMonth();
    const current = monthlyAverages.get(month) || { sum: 0, count: 0 };
    monthlyAverages.set(month, {
      sum: current.sum + item.searchVolume,
      count: current.count + 1,
    });
  });

  const monthlyData = Array.from(monthlyAverages.entries()).map(([month, data]) => ({
    month,
    average: data.sum / data.count,
  }));

  // 找出高于平均值的月份
  const overallAverage =
    monthlyData.reduce((sum, d) => sum + d.average, 0) / monthlyData.length;
  const peakMonths = monthlyData
    .filter((d) => d.average > overallAverage * 1.2) // 高于平均值20%
    .map((d) => d.month + 1); // 转换为1-12月

  return {
    isSeasonal: seasonalityStrength > 0.3, // 季节性强度超过0.3视为季节性商品
    seasonalityStrength: Math.round(seasonalityStrength * 100) / 100,
    peakMonths,
  };
}

/**
 * 识别全年热销商品
 */
export function identifyYearRoundProduct(history: TrendHistory[]): boolean {
  if (history.length < 90) return false;

  const searchVolumes = history.map((h) => h.searchVolume);
  const average = searchVolumes.reduce((a, b) => a + b, 0) / searchVolumes.length;

  // 计算变异系数
  const variance =
    searchVolumes.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
    searchVolumes.length;
  const stdDev = Math.sqrt(variance);
  const cv = average > 0 ? stdDev / average : 0;

  // 变异系数小于0.3且平均搜索量较高，视为全年热销
  return cv < 0.3 && average > 100;
}

/**
 * 检测趋势方向
 */
export function detectTrendDirection(
  history: TrendHistory[]
): 'up' | 'down' | 'stable' {
  if (history.length < 7) return 'stable';

  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recent = sorted.slice(-7);
  const previous = sorted.slice(-14, -7);

  if (previous.length === 0) return 'stable';

  const recentAvg = recent.reduce((sum, h) => sum + h.searchVolume, 0) / recent.length;
  const previousAvg =
    previous.reduce((sum, h) => sum + h.searchVolume, 0) / previous.length;

  const change = ((recentAvg - previousAvg) / previousAvg) * 100;

  if (change > 10) return 'up';
  if (change < -10) return 'down';
  return 'stable';
}

/**
 * 预测未来趋势（简单线性回归）
 */
export function predictFutureTrend(
  history: TrendHistory[],
  daysAhead: number = 7
): number[] {
  if (history.length < 7) return [];

  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 使用最近30天的数据进行预测
  const recentData = sorted.slice(-30);
  const x = recentData.map((_, i) => i);
  const y = recentData.map((h) => h.searchVolume);

  // 计算线性回归参数
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 预测未来值
  const predictions: number[] = [];
  for (let i = 1; i <= daysAhead; i++) {
    const futureX = n + i;
    const prediction = slope * futureX + intercept;
    predictions.push(Math.max(0, Math.round(prediction))); // 确保非负
  }

  return predictions;
}

/**
 * 时间序列数据聚合
 */
export function aggregateTimeSeriesData(
  history: TrendHistory[],
  interval: 'daily' | 'weekly' | 'monthly'
): Array<{
  period: string;
  avgSearchVolume: number;
  avgSalesRank: number;
  avgPrice: number;
  count: number;
}> {
  const grouped = new Map<
    string,
    {
      searchVolumes: number[];
      salesRanks: number[];
      prices: number[];
    }
  >();

  history.forEach((item) => {
    const date = new Date(item.date);
    let key: string;

    switch (interval) {
      case 'weekly':
        // 获取周数
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = item.date;
    }

    const current = grouped.get(key) || {
      searchVolumes: [],
      salesRanks: [],
      prices: [],
    };

    current.searchVolumes.push(item.searchVolume);
    current.salesRanks.push(item.salesRank);
    current.prices.push(item.price);

    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .map(([period, data]) => ({
      period,
      avgSearchVolume:
        data.searchVolumes.reduce((a, b) => a + b, 0) / data.searchVolumes.length,
      avgSalesRank: data.salesRanks.reduce((a, b) => a + b, 0) / data.salesRanks.length,
      avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
      count: data.searchVolumes.length,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
