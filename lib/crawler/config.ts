/**
 * 爬虫配置
 */

export interface CrawlerConfig {
  // 浏览器配置
  headless: boolean;
  timeout: number;
  
  // 代理配置（可选）
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  
  // 延迟配置（毫秒）
  delays: {
    betweenPages: { min: number; max: number };
    betweenRequests: { min: number; max: number };
    betweenTasks: { min: number; max: number };
  };
  
  // 重试配置
  retry: {
    maxAttempts: number;
    delayMs: number;
  };
  
  // 限制配置
  limits: {
    maxPagesPerCrawl: number;
    maxProductsPerPage: number;
    maxConcurrentBrowsers: number;
  };
}

export const defaultCrawlerConfig: CrawlerConfig = {
  headless: true,
  timeout: 30000,
  
  delays: {
    betweenPages: { min: 2000, max: 4000 },
    betweenRequests: { min: 1000, max: 3000 },
    betweenTasks: { min: 5000, max: 10000 },
  },
  
  retry: {
    maxAttempts: 3,
    delayMs: 5000,
  },
  
  limits: {
    maxPagesPerCrawl: 5,
    maxProductsPerPage: 50,
    maxConcurrentBrowsers: 2,
  },
};

/**
 * 从环境变量加载配置
 */
export function loadCrawlerConfig(): CrawlerConfig {
  const config = { ...defaultCrawlerConfig };
  
  // 从环境变量覆盖配置
  if (process.env.CRAWLER_HEADLESS === 'false') {
    config.headless = false;
  }
  
  if (process.env.CRAWLER_TIMEOUT) {
    config.timeout = parseInt(process.env.CRAWLER_TIMEOUT);
  }
  
  // 代理配置
  if (process.env.CRAWLER_PROXY_SERVER) {
    config.proxy = {
      server: process.env.CRAWLER_PROXY_SERVER,
      username: process.env.CRAWLER_PROXY_USERNAME,
      password: process.env.CRAWLER_PROXY_PASSWORD,
    };
  }
  
  return config;
}

/**
 * 平台特定配置
 */
export const platformConfigs = {
  amazon: {
    baseUrl: 'https://www.amazon.com',
    searchPath: '/s',
    productPath: '/dp',
    selectors: {
      searchResults: '[data-component-type="s-search-result"]',
      productTitle: 'h2 a span',
      price: '.a-price-whole',
      rating: '.a-icon-star-small .a-icon-alt',
      reviews: '[aria-label*="stars"]',
      image: '.s-image',
    },
  },
  
  aliexpress: {
    baseUrl: 'https://www.aliexpress.com',
    searchPath: '/w/wholesale-',
    productPath: '/item',
    selectors: {
      searchResults: '.search-card-item, .list--gallery--C2f2tvm > div',
      productTitle: '.multi--titleText--nXeOvyr, .search-card-item__title',
      price: '.multi--price-sale--U-S0jtj, .search-card-item__sale-price',
      rating: '.multi--starRating--rOmvBxJ, .search-card-item__rating',
      orders: '.multi--trade--Ktbl2jB, .search-card-item__sold',
      image: 'img',
    },
  },
};
