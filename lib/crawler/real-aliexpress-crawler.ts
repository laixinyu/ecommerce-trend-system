/**
 * 真实的 AliExpress 爬虫实现
 * 使用 Puppeteer 进行网页抓取
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { calculateTrendScore } from '@/lib/analytics/trend-scoring';
import { calculateCompetitionScore } from '@/lib/analytics/competition-scoring';
import { calculateRecommendationScore } from '@/lib/analytics/recommendation';

export interface RealAliExpressProduct {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  orders: number;
  imageUrl: string;
  productUrl: string;
  searchKeyword: string; // 搜索关键词，不是类目ID
}

export class RealAliExpressCrawler {
  private browser: Browser | null = null;
  private readonly baseUrl = 'https://www.aliexpress.com';

  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

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

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createPage(): Promise<Page> {
    await this.initBrowser();
    const page = await this.browser!.newPage();

    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    return page;
  }

  private async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 搜索商品
   */
  async searchProducts(keyword: string, maxPages: number = 3, categoryName?: string): Promise<RealAliExpressProduct[]> {
    const products: RealAliExpressProduct[] = [];
    const page = await this.createPage();
    const searchTerm = keyword || categoryName || 'popular';

    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        console.log(`Crawling AliExpress page ${pageNum} for: ${searchTerm}`);

        // 构建搜索 URL
        const searchUrl = `${this.baseUrl}/w/wholesale-${encodeURIComponent(searchTerm)}.html?page=${pageNum}`;

        await page.goto(searchUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // 等待商品列表加载
        await this.randomDelay(2000, 4000);

        const html = await page.content();
        const $ = cheerio.load(html);

        // AliExpress 使用不同的选择器
        $('.search-card-item, .list--gallery--C2f2tvm > div').each((_, element) => {
          try {
            const $item = $(element);

            // 提取商品 ID
            const productLink = $item.find('a').attr('href') || '';
            const productIdMatch = productLink.match(/\/item\/(\d+)\.html/);
            const productId = productIdMatch ? productIdMatch[1] : '';

            if (!productId) return;

            // 提取标题
            const title = $item.find('.multi--titleText--nXeOvyr, .search-card-item__title').text().trim();
            if (!title) return;

            // 提取价格
            const priceText = $item.find('.multi--price-sale--U-S0jtj, .search-card-item__sale-price').text();
            const priceMatch = priceText.match(/[\d,.]+/);
            const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

            if (price === 0) return;

            // 提取原价
            const originalPriceText = $item.find('.multi--price-original--1zEQqOK, .search-card-item__original-price').text();
            const originalPriceMatch = originalPriceText.match(/[\d,.]+/);
            const originalPrice = originalPriceMatch ?
              parseFloat(originalPriceMatch[0].replace(/,/g, '')) : undefined;

            // 提取评分
            const ratingText = $item.find('.multi--starRating--rOmvBxJ, .search-card-item__rating').text();
            const ratingMatch = ratingText.match(/[\d.]+/);
            const rating = ratingMatch ? parseFloat(ratingMatch[0]) : 0;

            // 提取订单数
            const ordersText = $item.find('.multi--trade--Ktbl2jB, .search-card-item__sold').text();
            const ordersMatch = ordersText.match(/(\d+(?:,\d+)*)\+?\s*(?:sold|orders)/i);
            let orders = 0;
            if (ordersMatch) {
              orders = parseInt(ordersMatch[1].replace(/,/g, ''));
              // 处理 "1000+" 这样的情况
              if (ordersText.includes('+')) {
                orders = Math.floor(orders * 1.5);
              }
            }

            // 提取图片
            const imageUrl = $item.find('img').attr('src') || $item.find('img').attr('data-src') || '';

            // 构建完整的商品 URL
            const productUrl = productLink.startsWith('http') ?
              productLink : `${this.baseUrl}${productLink}`;

            products.push({
              productId,
              title,
              price,
              originalPrice,
              rating,
              orders,
              imageUrl: imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl,
              productUrl,
              searchKeyword: searchTerm,
            });
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });

        await this.randomDelay(2000, 4000);
      }
    } catch (error) {
      console.error('Error crawling AliExpress:', error);
    } finally {
      await page.close();
    }

    return products;
  }

  /**
   * 保存商品到数据库
   */
  async saveProducts(products: RealAliExpressProduct[], categoryId: string): Promise<number> {
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
        // 将订单数转换为评论数估算
        const estimatedReviews = Math.floor(product.orders * 0.1);

        // 构建临时 Product 对象用于计算评分
        const tempProduct: unknown = {
          id: product.productId,
          name: product.title,
          platform: 'aliexpress',
          currentPrice: product.price,
          averageRating: product.rating,
          reviewCount: estimatedReviews,
          sellerCount: 1, // 默认值
          createdAt: new Date().toISOString(),
        };

        // 计算各项指标
        const trendScore = calculateTrendScore(tempProduct, []);
        const competitionScore = calculateCompetitionScore(tempProduct, []);
        const recommendationScore = calculateRecommendationScore(tempProduct, [], []);

        // 检查商品是否已存在
        const { data: existing, error: selectError } = await supabase
          .from('products')
          .select('id')
          .eq('platform_id', product.productId)
          .eq('platform', 'aliexpress')
          .maybeSingle();

        if (selectError) {
          console.error(`Error checking existing product ${product.productId}:`, selectError);
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
          review_count: estimatedReviews,
          average_rating: product.rating,
          seller_count: 1,
          last_crawled_at: new Date().toISOString(),
        };

        if (existing) {
          // 更新现有商品
          const { error: updateError } = await supabase
            .from('products')
            .update(productData as unknown)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating product ${product.productId}:`, updateError);
          } else {
            console.log(`Updated product: ${product.title}`);
            savedCount++;
          }
        } else {
          // 插入新商品
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              platform_id: product.productId,
              platform: 'aliexpress' as const,
              category_id: categoryId,
              ...productData,
            } as unknown);

          if (insertError) {
            console.error(`Error inserting product ${product.productId}:`, insertError);
          } else {
            console.log(`Inserted new product: ${product.title}`);
            savedCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to save product ${product.productId}:`, error);
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
      console.log(`Starting real AliExpress crawl for: ${keyword || categoryName || 'category browse'}`);

      const products = await this.searchProducts(keyword, maxPages, categoryName);
      console.log(`Crawled ${products.length} products from AliExpress`);

      if (products.length === 0) {
        console.log('No products found');
        return 0;
      }

      const savedCount = await this.saveProducts(products, categoryId);
      console.log(`Saved ${savedCount} products to database`);

      return savedCount;
    } finally {
      await this.closeBrowser();
    }
  }
}

export const realAliExpressCrawler = new RealAliExpressCrawler();
