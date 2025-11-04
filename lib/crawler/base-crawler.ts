/**
 * 爬虫基类
 * 提供通用的爬虫功能
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { proxyManager } from './proxy-manager';
import { rateLimiter, RateLimiter } from './rate-limiter';
import { errorHandler } from './error-handler';
import { loadCrawlerConfig } from './config';

export abstract class BaseCrawler {
  protected browser: Browser | null = null;
  protected config = loadCrawlerConfig();
  protected rateLimiter: RateLimiter;
  
  protected userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  constructor() {
    this.rateLimiter = new RateLimiter({
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100,
    });
  }

  /**
   * 初始化浏览器
   */
  protected async initBrowser(): Promise<void> {
    if (this.browser) {
      return;
    }

    const launchOptions: any = {
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-blink-features=AutomationControlled',
      ],
    };

    // 添加代理配置
    const proxy = proxyManager.getNextProxy();
    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy.server}`);
      console.log(`Using proxy: ${proxy.server}`);
    }

    this.browser = await puppeteer.launch(launchOptions);
  }

  /**
   * 关闭浏览器
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 创建新页面
   */
  protected async createPage(): Promise<Page> {
    await this.initBrowser();
    const page = await this.browser!.newPage();
    
    // 设置随机用户代理
    const userAgent = this.getRandomUserAgent();
    await page.setUserAgent(userAgent);
    
    // 设置视口
    await page.setViewport({ 
      width: 1920, 
      height: 1080,
      deviceScaleFactor: 1,
    });
    
    // 设置额外的 HTTP 头
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    // 隐藏 webdriver 特征
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // 代理认证
    const proxy = proxyManager.getNextProxy();
    if (proxy && proxy.username && proxy.password) {
      await page.authenticate({
        username: proxy.username,
        password: proxy.password,
      });
    }

    return page;
  }

  /**
   * 获取随机用户代理
   */
  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * 随机延迟
   */
  protected async randomDelay(min?: number, max?: number): Promise<void> {
    const delayMin = min || this.config.delays.betweenRequests.min;
    const delayMax = max || this.config.delays.betweenRequests.max;
    const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 带重试的页面访问
   */
  protected async gotoWithRetry(
    page: Page,
    url: string,
    maxAttempts: number = 3
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // 等待速率限制
        await this.rateLimiter.waitForSlot();

        console.log(`Visiting ${url} (attempt ${attempt}/${maxAttempts})`);
        
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: this.config.timeout,
        });

        return true;
      } catch (error) {
        const crawlerError = errorHandler.handleError(error, url);
        
        if (attempt < maxAttempts && crawlerError.retryable) {
          const delay = errorHandler.getRetryDelay(attempt);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`Failed to visit ${url} after ${maxAttempts} attempts`);
          return false;
        }
      }
    }

    return false;
  }

  /**
   * 安全地提取文本
   */
  protected safeExtractText(element: any, selector: string, defaultValue: string = ''): string {
    try {
      const text = element.find(selector).text().trim();
      return text || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 安全地提取数字
   */
  protected safeExtractNumber(text: string, defaultValue: number = 0): number {
    try {
      const match = text.match(/[\d,.]+/);
      if (match) {
        return parseFloat(match[0].replace(/,/g, ''));
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 检查页面是否被封禁
   */
  protected async isPageBlocked(page: Page): Promise<boolean> {
    const content = await page.content();
    const blockedKeywords = [
      'captcha',
      'robot',
      'access denied',
      'blocked',
      'suspicious activity',
      'verify you are human',
    ];

    const contentLower = content.toLowerCase();
    return blockedKeywords.some(keyword => contentLower.includes(keyword));
  }

  /**
   * 滚动页面（加载动态内容）
   */
  protected async scrollPage(page: Page, scrolls: number = 3): Promise<void> {
    for (let i = 0; i < scrolls; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await this.randomDelay(500, 1000);
    }
  }

  /**
   * 获取爬虫统计
   */
  getStats(): {
    rateLimiter: any;
    errors: any;
    proxy: any;
  } {
    return {
      rateLimiter: this.rateLimiter.getStats(),
      errors: errorHandler.getErrorStats(),
      proxy: {
        hasProxy: proxyManager.hasProxy(),
        activeProxies: proxyManager.getActiveProxyCount(),
      },
    };
  }

  /**
   * 抽象方法：子类必须实现
   */
  abstract searchProducts(keyword: string, maxPages: number): Promise<any[]>;
  abstract saveProducts(products: any[], categoryId: string): Promise<number>;
}
