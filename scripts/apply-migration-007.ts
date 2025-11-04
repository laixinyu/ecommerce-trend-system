// 应用数字化能力扩展迁移
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('请确保 .env.local 文件中包含:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 开始应用数字化能力扩展迁移...\n');

  try {
    // 读取迁移文件
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/007_digital_capabilities.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 读取迁移文件: 007_digital_capabilities.sql');

    // 分割SQL语句（按分号分割，但要注意函数定义中的分号）
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 找到 ${statements.length} 条SQL语句\n`);

    // 执行每条语句
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // 跳过注释
      if (statement.trim().startsWith('--')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // 尝试直接执行（某些语句可能不支持rpc）
          console.log(`⚠️  语句 ${i + 1} 使用RPC失败，尝试直接执行...`);
          // 注意：Supabase客户端不直接支持执行DDL，需要使用管理API或数据库连接
          console.log(`   ${statement.substring(0, 100)}...`);
          errorCount++;
        } else {
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`✅ 已执行 ${i + 1}/${statements.length} 条语句`);
          }
        }
      } catch (err) {
        console.error(`❌ 执行语句 ${i + 1} 时出错:`, err);
        console.error(`   语句: ${statement.substring(0, 100)}...`);
        errorCount++;
      }
    }

    console.log('\n📊 迁移执行结果:');
    console.log(`   ✅ 成功: ${successCount} 条`);
    console.log(`   ❌ 失败: ${errorCount} 条`);

    if (errorCount > 0) {
      console.log('\n⚠️  部分语句执行失败');
      console.log('💡 建议: 请在Supabase Dashboard的SQL Editor中手动执行迁移文件');
      console.log(`   文件路径: supabase/migrations/007_digital_capabilities.sql`);
    } else {
      console.log('\n✅ 迁移应用成功！');
    }

    // 验证表是否创建成功
    console.log('\n🔍 验证新表...');
    const tables = [
      'integrations',
      'ad_campaigns',
      'crm_customers',
      'automation_rules',
      'content_assets',
      'inventory_items',
      'orders',
      'dashboards',
      'workflows',
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ 表 ${table} 不存在或无法访问`);
      } else {
        console.log(`   ✅ 表 ${table} 已创建 (当前记录数: ${count || 0})`);
      }
    }

    console.log('\n✨ 迁移过程完成！');
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
applyMigration();
