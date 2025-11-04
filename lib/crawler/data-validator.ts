/**
 * 爬虫数据验证器
 * 验证和清理爬取的数据
 */

export interface ProductData {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  productUrl: string;
}

export class DataValidator {
  /**
   * 验证商品数据
   */
  validateProduct(product: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 必填字段
    if (!product.id || typeof product.id !== 'string') {
      errors.push('Invalid or missing product ID');
    }

    if (!product.title || typeof product.title !== 'string' || product.title.length < 3) {
      errors.push('Invalid or missing product title');
    }

    if (typeof product.price !== 'number' || product.price <= 0) {
      errors.push('Invalid product price');
    }

    if (!product.productUrl || !this.isValidUrl(product.productUrl)) {
      errors.push('Invalid product URL');
    }

    // 可选字段验证
    if (product.originalPrice !== undefined) {
      if (typeof product.originalPrice !== 'number' || product.originalPrice < product.price) {
        errors.push('Invalid original price');
      }
    }

    if (product.rating !== undefined) {
      if (typeof product.rating !== 'number' || product.rating < 0 || product.rating > 5) {
        errors.push('Invalid rating (must be 0-5)');
      }
    }

    if (product.reviewCount !== undefined) {
      if (typeof product.reviewCount !== 'number' || product.reviewCount < 0) {
        errors.push('Invalid review count');
      }
    }

    if (product.imageUrl && !this.isValidUrl(product.imageUrl)) {
      errors.push('Invalid image URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 清理商品数据
   */
  cleanProduct(product: any): ProductData {
    return {
      id: String(product.id).trim(),
      title: this.cleanText(product.title),
      price: this.cleanPrice(product.price),
      originalPrice: product.originalPrice ? this.cleanPrice(product.originalPrice) : undefined,
      rating: product.rating ? this.cleanRating(product.rating) : undefined,
      reviewCount: product.reviewCount ? Math.max(0, Math.floor(product.reviewCount)) : undefined,
      imageUrl: product.imageUrl ? this.cleanUrl(product.imageUrl) : undefined,
      productUrl: this.cleanUrl(product.productUrl),
    };
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u4E00-\u9FFF]/g, '') // 保留 ASCII 和中文
      .substring(0, 500); // 限制长度
  }

  /**
   * 清理价格
   */
  private cleanPrice(price: number): number {
    const cleaned = Math.abs(price);
    return Math.round(cleaned * 100) / 100; // 保留两位小数
  }

  /**
   * 清理评分
   */
  private cleanRating(rating: number): number {
    const cleaned = Math.max(0, Math.min(5, rating));
    return Math.round(cleaned * 10) / 10; // 保留一位小数
  }

  /**
   * 清理 URL
   */
  private cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      // 如果不是完整 URL，尝试补全
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      return url;
    }
  }

  /**
   * 验证 URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 批量验证商品
   */
  validateProducts(products: any[]): {
    valid: ProductData[];
    invalid: Array<{ product: any; errors: string[] }>;
  } {
    const valid: ProductData[] = [];
    const invalid: Array<{ product: any; errors: string[] }> = [];

    products.forEach(product => {
      const validation = this.validateProduct(product);
      
      if (validation.valid) {
        valid.push(this.cleanProduct(product));
      } else {
        invalid.push({
          product,
          errors: validation.errors,
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * 去重商品
   */
  deduplicateProducts(products: ProductData[]): ProductData[] {
    const seen = new Set<string>();
    const unique: ProductData[] = [];

    products.forEach(product => {
      if (!seen.has(product.id)) {
        seen.add(product.id);
        unique.push(product);
      }
    });

    return unique;
  }

  /**
   * 过滤低质量商品
   */
  filterLowQualityProducts(products: ProductData[], minRating: number = 3.0): ProductData[] {
    return products.filter(product => {
      // 没有评分的保留
      if (product.rating === undefined) {
        return true;
      }
      
      return product.rating >= minRating;
    });
  }

  /**
   * 检测异常价格
   */
  detectAnomalousPrices(products: ProductData[]): ProductData[] {
    if (products.length < 3) {
      return products;
    }

    const prices = products.map(p => p.price).sort((a, b) => a - b);
    const q1 = prices[Math.floor(prices.length * 0.25)];
    const q3 = prices[Math.floor(prices.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return products.filter(product => {
      return product.price >= lowerBound && product.price <= upperBound;
    });
  }
}

export const dataValidator = new DataValidator();
