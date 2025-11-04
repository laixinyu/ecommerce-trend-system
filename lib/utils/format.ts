/**
 * 格式化工具函数
 */

/**
 * 格式化数字为货币格式
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // 根据货币类型选择合适的 locale
  const locale = currency === 'CNY' ? 'zh-CN' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 根据平台格式化货币
 */
export function formatCurrencyByPlatform(amount: number, platform: string): string {
  // Amazon 和 AliExpress 主要使用美元
  const currencyMap: Record<string, string> = {
    amazon: 'USD',
    aliexpress: 'USD',
    ebay: 'USD',
    taobao: 'CNY',
    pinduoduo: 'CNY',
  };
  
  const currency = currencyMap[platform.toLowerCase()] || 'USD';
  return formatCurrency(amount, currency);
}

/**
 * 格式化数字为紧凑格式 (1000 -> 1K)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }
  
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * 格式化相对时间 (2小时前)
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
}
