/**
 * Supabase 连接测试脚本
 * 
 * 使用方法:
 * npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfoztyyzbgdqtlzijxtk.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmb3p0eXl6YmdkcXRsemlqeHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjUwMjEsImV4cCI6MjA3NjcwMTAyMX0.Lq2jdTt8gAre8eaT1EQTzZguPQxLNlBUc6bWZBj8qfY'

async function testConnection() {
  console.log('🔍 测试 Supabase 连接...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 测试 1: 检查类目表
    console.log('1️⃣ 检查 categories 表...')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)
    
    if (catError) {
      console.error('❌ Categories 表错误:', catError.message)
      return false
    }
    console.log(`✅ Categories 表正常 (${categories?.length || 0} 条记录)`)
    
    // 测试 2: 检查关键词表
    console.log('\n2️⃣ 检查 keywords 表...')
    const { data: keywords, error: keyError } = await supabase
      .from('keywords')
      .select('*')
      .limit(5)
    
    if (keyError) {
      console.error('❌ Keywords 表错误:', keyError.message)
      return false
    }
    console.log(`✅ Keywords 表正常 (${keywords?.length || 0} 条记录)`)
    
    // 测试 3: 检查商品表
    console.log('\n3️⃣ 检查 products 表...')
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5)
    
    if (prodError) {
      console.error('❌ Products 表错误:', prodError.message)
      return false
    }
    console.log(`✅ Products 表正常 (${products?.length || 0} 条记录)`)
    
    // 测试 4: 检查爬取日志表
    console.log('\n4️⃣ 检查 crawl_logs 表...')
    const { data: logs, error: logError } = await supabase
      .from('crawl_logs')
      .select('*')
      .limit(5)
    
    if (logError) {
      console.error('❌ Crawl_logs 表错误:', logError.message)
      return false
    }
    console.log(`✅ Crawl_logs 表正常 (${logs?.length || 0} 条记录)`)
    
    console.log('\n✅ 所有测试通过！Supabase 连接正常。')
    return true
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error)
    return false
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
