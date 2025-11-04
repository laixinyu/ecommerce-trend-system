/**
 * 真实的 Amazon 爬虫实现
 * 使用 Puppeteer 进行网页抓取
 * 注意：请遵守 Amazon 的服务条款和 robots.txt
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { calculateTrendScore } from '@/lib/analytics/trend-scoring';
import { calculateCompetitionScore } from '@/lib/analytics/competition-scoring';
import { calculateRecommendationScore } from '@/lib/analytics/recommendation';

export interface RealAmazonProduct {
  asin: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  productUrl: string;
  searchKeyword: string; // 搜索关键词，不是类目ID
}

export class RealAmazonCrawler {
  private browser: Browser | null = null;
  private readonly baseUrl = 'https://www.amazon.com';

  // 用户代理列表，随机选择以避免被检测
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];

  /**
   * 初始化浏览器
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
        ],
      });
    }
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
   * 创建新页面并设置
   */
  private async createPage(): Promise<Page> {
    await this.initBrowser();
    const page = await this.browser!.newPage();

    // 随机选择用户代理
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    await page.setUserAgent(userAgent);

    // 设置视口
    await page.setViewport({ width: 1920, height: 1080 });

    // 设置额外的 HTTP 头
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    return page;
  }

  /**
   * 随机延迟，模拟人类行为
   */
  private async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 搜索商品
   */
  async searchProducts(keyword: string, maxPages: number = 3, categoryName?: string): Promise<RealAmazonProduct[]> {
    const products: RealAmazonProduct[] = [];
    const page = await this.createPage();

    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        console.log(`Crawling Amazon page ${pageNum} for: ${keyword || categoryName || 'category browse'}`);

        // 构建搜索 URL
        let searchUrl: string;
        if (keyword) {
          // 使用关键词搜索
          searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(keyword)}&page=${pageNum}`;
        } else if (categoryName) {
          // 按类目浏览（使用类目名称作为搜索词）
          searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(categoryName)}&page=${pageNum}`;
        } else {
          // 默认浏览热门商品
          searchUrl = `${this.baseUrl}/s?k=best+sellers&page=${pageNum}`;
        }

        // 访问搜索页面
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });

        // 尝试多个选择器，等待任意一个加载成功
        try {
          await Promise.race([
            page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 8000 }),
            page.waitForSelector('.s-result-item[data-asin]', { timeout: 8000 }),
            page.waitForSelector('div[data-component-type="s-search-result"]', { timeout: 8000 }),
            page.waitForSelector('.s-search-results', { timeout: 8000 }),
          ]);
        } catch {
          console.log('Selector timeout, continuing with page content...');
          // 即使选择器超时，也尝试解析页面内容
        }

        // 获取页面 HTML
        const html = await page.content();
        const $ = cheerio.load(html);

        // 解析商品列表 - 尝试多种选择器
        const selectors = [
          '[data-component-type="s-search-result"]',
          '.s-result-item[data-asin]',
          'div[data-component-type="s-search-result"]',
          '[data-asin]:not([data-asin=""])',
        ];

        let foundProducts = false;
        for (const selector of selectors) {
          const items = $(selector);
          if (items.length > 0) {
            console.log(`Found ${items.length} products using selector: ${selector}`);
            foundProducts = true;

            items.each((_, element) => {
              try {
                const $item = $(element);

                // 提取 ASIN
                const asin = $item.attr('data-asin');
                if (!asin || asin === '') return;

                // 提取标题 - 尝试多种选择器
                let title = $item.find('h2 a span').text().trim();
                if (!title) title = $item.find('h2 span').text().trim();
                if (!title) title = $item.find('.a-text-normal').text().trim();
                if (!title) return;

                // 提取价格 - 尝试多种格式
                let price = 0;
                const priceWhole = $item.find('.a-price-whole').first().text().replace(/[^0-9]/g, '');
                const priceFraction = $item.find('.a-price-fraction').first().text();
                if (priceWhole) {
                  price = parseFloat(`${priceWhole}.${priceFraction || '00'}`);
                } else {
                  // 尝试其他价格选择器
                  const priceText = $item.find('.a-price .a-offscreen').first().text();
                  if (priceText) {
                    price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                  }
                }

                if (price === 0) return;

                // 提取原价（如果有折扣）
                const originalPriceText = $item.find('.a-price.a-text-price .a-offscreen').text();
                const originalPrice = originalPriceText ?
                  parseFloat(originalPriceText.replace(/[^0-9.]/g, '')) : undefined;

                // 提取评分
                let rating = 0;
                const ratingText = $item.find('.a-icon-star-small .a-icon-alt').text();
                if (ratingText) {
                  const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                  rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
                }

                // 提取评论数 - 尝试多种选择器和格式
                let reviewCount = 0;

                // 方法1: aria-label 属性
                const reviewText = $item.find('[aria-label*="stars"]').attr('aria-label') || '';
                let reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
                if (reviewMatch) {
                  reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
                }

                // 方法2: 下划线文本
                if (reviewCount === 0) {
                  const reviewCountText = $item.find('.a-size-base.s-underline-text').text();
                  reviewMatch = reviewCountText.match(/(\d+(?:,\d+)*)/);
                  if (reviewMatch) {
                    reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
                  }
                }

                // 方法3: 包含 "ratings" 的文本
                if (reviewCount === 0) {
                  const ratingsText = $item.find('span:contains("ratings")').text() ||
                    $item.find('span:contains("rating")').text();
                  reviewMatch = ratingsText.match(/(\d+(?:,\d+)*)/);
                  if (reviewMatch) {
                    reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
                  }
                }

                // 方法4: 处理 K/M 格式 (如 "2.5K" 或 "1.2M")
                if (reviewCount === 0) {
                  const allText = $item.text();
                  const kMatch = allText.match(/(\d+\.?\d*)\s*K/i);
                  const mMatch = allText.match(/(\d+\.?\d*)\s*M/i);

                  if (kMatch) {
                    reviewCount = Math.round(parseFloat(kMatch[1]) * 1000);
                  } else if (mMatch) {
                    reviewCount = Math.round(parseFloat(mMatch[1]) * 1000000);
                  }
                }

                console.log(`商品评论数: ${reviewCount} (${title.substring(0, 50)}...)`);

                // 提取图片
                let imageUrl = $item.find('.s-image').attr('src') || '';
                if (!imageUrl) imageUrl = $item.find('img').first().attr('src') || '';

                // 构建商品 URL
                const productUrl = `${this.baseUrl}/dp/${asin}`;

                products.push({
                  asin,
                  title,
                  price,
                  originalPrice,
                  rating,
                  reviewCount,
                  imageUrl,
                  productUrl,
                  searchKeyword: keyword || categoryName || 'category',
                });
              } catch (error) {
                console.error('Error parsing product:', error);
              }
            });

            break; // 找到产品后退出循环
          }
        }

        if (!foundProducts) {
          console.log('No products found with any selector, saving page HTML for debugging...');
          // 可以选择保存 HTML 用于调试
          // await page.screenshot({ path: `debug-${pageNum}.png` });
        }

        // 随机延迟，避免被检测
        await this.randomDelay(2000, 4000);
      }
    } catch (error) {
      console.error('Error crawling Amazon:', error);
    } finally {
      await page.close();
    }

    return products;
  }

  /**
   * 获取商品详情
   */
  async getProductDetails(asin: string): Promise<Partial<RealAmazonProduct> | null> {
    const page = await this.createPage();

    try {
      const productUrl = `${this.baseUrl}/dp/${asin}`;
      await page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      // 提取详细信息
      const title = $('#productTitle').text().trim();
      const priceText = $('.a-price .a-offscreen').first().text();
      const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;

      const ratingText = $('.a-icon-star .a-icon-alt').first().text();
      const rating = ratingText ? parseFloat(ratingText.split(' ')[0]) : 0;

      // 提取评论数 - 尝试多种选择器
      let reviewCount = 0;

      // 方法1: #acrCustomerReviewText
      let reviewText = $('#acrCustomerReviewText').text();
      let reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
      if (reviewMatch) {
        reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
      }

      // 方法2: data-hook="total-review-count"
      if (reviewCount === 0) {
        reviewText = $('[data-hook="total-review-count"]').text();
        reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
        if (reviewMatch) {
          reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
        }
      }

      // 方法3: 包含 "ratings" 的任何文本
      if (reviewCount === 0) {
        reviewText = $('span:contains("ratings")').first().text() ||
          $('span:contains("rating")').first().text();
        reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
        if (reviewMatch) {
          reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
        }
      }

      // 方法4: 处理 K/M 格式
      if (reviewCount === 0) {
        const pageText = $('body').text();
        const kMatch = pageText.match(/(\d+\.?\d*)\s*K\s*(?:ratings|reviews)/i);
        const mMatch = pageText.match(/(\d+\.?\d*)\s*M\s*(?:ratings|reviews)/i);

        if (kMatch) {
          reviewCount = Math.round(parseFloat(kMatch[1]) * 1000);
        } else if (mMatch) {
          reviewCount = Math.round(parseFloat(mMatch[1]) * 1000000);
        }
      }

      console.log(`商品详情 - ASIN: ${asin}, 评论数: ${reviewCount}`);

      const imageUrl = $('#landingImage').attr('src') || '';

      return {
        asin,
        title,
        price,
        rating,
        reviewCount,
        imageUrl,
        productUrl,
      };
    } catch (error) {
      console.error(`Error getting product details for ${asin}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * 保存商品到数据库
   */
  async saveProducts(products: RealAmazonProduct[], categoryId: string): Promise<number> {
    // 使用 service role key 绕过 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    let savedCount = 0;

    for (const product of products) {
      try {
        // 构建临时 Product 对象用于计算评分
        const tempProduct = {
          id: product.asin,
          platformId: product.asin,
          platform: 'amazon' as const,
          name: product.title,
          categoryId: categoryId,
          currentPrice: product.price,
          trendScore: 0,
          competitionScore: 0,
          recommendationScore: 0,
          averageRating: product.rating,
          reviewCount: product.reviewCount,
          sellerCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 计算各项指标
        const trendScore = calculateTrendScore(tempProduct, []);
        const competitionScore = calculateCompetitionScore(tempProduct, []);
        const recommendationScore = calculateRecommendationScore(tempProduct, [], []);

        // 调试日志
        console.log(`Scores for ${product.title.substring(0, 30)}:`, {
          trendScore,
          competitionScore,
          recommendationScore,
        });

        // 检查商品是否已存在
        const { data: existing, error: selectError } = await supabase
          .from('products')
          .select('id')
          .eq('platform_id', product.asin)
          .eq('platform', 'amazon')
          .maybeSingle();

        if (selectError) {
          console.error(`Error checking existing product ${product.asin}:`, selectError);
          continue;
        }

        const productData = {
          name: product.title,
          current_price: product.price,
          image_url: product.imageUrl,
          product_url: product.productUrl,
          external_url: product.productUrl,
          trend_score: trendScore,
          competition_score: competitionScore,
          recommendation_score: recommendationScore,
          review_count: product.reviewCount,
          average_rating: product.rating,
          seller_count: 1,
          last_crawled_at: new Date().toISOString(),
        };

        if (existing) {
          // 更新现有商品
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating product ${product.asin}:`, updateError);
          } else {
            console.log(`Updated product: ${product.title}`);
            savedCount++;
          }
        } else {
          // 插入新商品
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              platform_id: product.asin,
              platform: 'amazon' as const,
              category_id: categoryId,
              ...productData,
            });

          if (insertError) {
            console.error(`Error inserting product ${product.asin}:`, insertError);
          } else {
            console.log(`Inserted new product: ${product.title}`);
            savedCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to save product ${product.asin}:`, error);
      }
    }

    console.log(`Successfully saved ${savedCount}/${products.length} products to database`);
    return savedCount;
  }

  /**
   * 执行完整的爬取流程
   */
  async execute(keyword: string, categoryId: string, maxPages: number = 3, categoryName?: string): Promise<number> {
    try {
      console.log(`Starting real Amazon crawl for: ${keyword || categoryName || 'category browse'}`);

      // 1. 搜索并爬取商品
      const products = await this.searchProducts(keyword, maxPages, categoryName);
      console.log(`Crawled ${products.length} products from Amazon`);

      if (products.length === 0) {
        console.log('No products found');
        return 0;
      }

      // 2. 保存到数据库
      const savedCount = await this.saveProducts(products, categoryId);
      console.log(`Saved ${savedCount} products to database`);

      return savedCount;
    } finally {
      await this.closeBrowser();
    }
  }
}

export const realAmazonCrawler = new RealAmazonCrawler();
