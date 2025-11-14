/**
 * 应用迁移 011: 添加 products 表的删除策略
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 开始应用迁移 011: 添加 products 表的删除策略\n');

  try {
    // 读取迁移文件
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '011_products_delete_policy.sql'
    );

    console.log('📖 读取迁移文件...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // 执行迁移
    console.log('⚙️  执行迁移...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // 如果 exec_sql 函数不存在，尝试直接执行
      console.log('⚠️  exec_sql 函数不可用，尝试分步执行...\n');

      // 分割 SQL 语句
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          console.log(`执行: ${statement.substring(0, 80)}...`);
          const { error: stmtError } = await (supabase as any).rpc('exec', {
            sql: statement + ';',
          });

          if (stmtError) {
            console.error('❌ 执行失败:', stmtError.message);
            console.log('\n⚠️  请手动在 Supabase SQL Editor 中执行迁移文件');
            console.log(`文件位置: ${migrationPath}\n`);
            process.exit(1);
          }
        }
      }
    }

    console.log('\n✅ 迁移应用成功！\n');

    // 验证策略
    console.log('🔍 验证策略...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'products');

    if (!policiesError && policies) {
      console.log(`\n找到 ${policies.length} 个 products 表的策略:`);
      policies.forEach((policy: any) => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n📝 说明:');
    console.log('  - 现在认证用户可以删除商品');
    console.log('  - 批量删除功能应该可以正常工作了');
    console.log('  - 建议在生产环境中根据需要调整权限\n');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    console.log('\n⚠️  请手动在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL:\n');
    console.log('---');
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '011_products_delete_policy.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(migrationSQL);
    console.log('---\n');
    process.exit(1);
  }
}

applyMigration();
