/**
 * 测试真实爬虫功能
 * 运行: npm run test:crawler
 */

import { realAmazonCrawler } from '../lib/crawler/real-amazon-crawler';
import { realAliExpressCrawler } from '../lib/crawler/real-aliexpress-crawler';

async function testAmazonCrawler() {
  console.log('\n=== 测试 Amazon 爬虫 ===\n');
  
  try {
    console.log('开始爬取 Amazon 商品...');
    const products = await realAmazonCrawler.searchProducts('wireless earbuds', 1);
    
    console.log(`\n✅ 成功爬取 ${products.length} 个商品\n`);
    
    if (products.length > 0) {
      console.log('示例商品:');
      const sample = products[0];
      console.log({
        asin: sample.asin,
        title: sample.title.substring(0, 50) + '...',
        price: `$${sample.price}`,
        rating: sample.rating,
        reviewCount: sample.reviewCount,
      });
    }
    
    await realAmazonCrawler.closeBrowser();
    return true;
  } catch (error) {
    console.error('❌ Amazon 爬虫测试失败:', error);
    await realAmazonCrawler.closeBrowser();
    return false;
  }
}

async function testAliExpressCrawler() {
  console.log('\n=== 测试 AliExpress 爬虫 ===\n');
  
  try {
    console.log('开始爬取 AliExpress 商品...');
    const products = await realAliExpressCrawler.searchProducts('bluetooth headphones', 1);
    
    console.log(`\n✅ 成功爬取 ${products.length} 个商品\n`);
    
    if (products.length > 0) {
      console.log('示例商品:');
      const sample = products[0];
      console.log({
        productId: sample.productId,
        title: sample.title.substring(0, 50) + '...',
        price: `$${sample.price}`,
        rating: sample.rating,
        orders: sample.orders,
      });
    }
    
    await realAliExpressCrawler.closeBrowser();
    return true;
  } catch (error) {
    console.error('❌ AliExpress 爬虫测试失败:', error);
    await realAliExpressCrawler.closeBrowser();
    return false;
  }
}

async function main() {
  console.log('🚀 开始测试真实爬虫功能...\n');
  console.log('⚠️  注意：');
  console.log('   - 首次运行会下载 Chromium，可能需要几分钟');
  console.log('   - 爬取过程需要时间，请耐心等待');
  console.log('   - 确保网络连接正常\n');
  
  const results = {
    amazon: false,
    aliexpress: false,
  };
  
  // 测试 Amazon
  results.amazon = await testAmazonCrawler();
  
  // 延迟一下再测试下一个
  console.log('\n等待 5 秒后测试下一个平台...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 测试 AliExpress
  results.aliexpress = await testAliExpressCrawler();
  
  // 总结
  console.log('\n=== 测试总结 ===\n');
  console.log(`Amazon 爬虫: ${results.amazon ? '✅ 通过' : '❌ 失败'}`);
  console.log(`AliExpress 爬虫: ${results.aliexpress ? '✅ 通过' : '❌ 失败'}`);
  
  const allPassed = results.amazon && results.aliexpress;
  console.log(`\n${allPassed ? '🎉 所有测试通过！' : '⚠️  部分测试失败'}\n`);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('测试过程出错:', error);
  process.exit(1);
});
