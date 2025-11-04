/**
 * 应用 006 迁移：为 categories 表添加 platform 字段
 * 
 * 注意：此脚本需要使用 Supabase 的 SQL Editor 或 CLI 来执行
 * 因为 Supabase JS 客户端不支持直接执行 DDL 语句
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('📋 迁移 006: 添加 platform 字段到 categories 表\n');
console.log('⚠️  此迁移需要在 Supabase Dashboard 的 SQL Editor 中手动执行\n');

// 读取并显示迁移 SQL
const migrationPath = path.join(__dirname, '../supabase/migrations/006_add_platform_to_categories.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('📝 请复制以下 SQL 并在 Supabase Dashboard > SQL Editor 中执行:\n');
console.log('='.repeat(80));
console.log(migrationSQL);
console.log('='.repeat(80));

console.log('\n📍 步骤:');
console.log('1. 访问 Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. 选择你的项目');
console.log('3. 点击左侧菜单的 "SQL Editor"');
console.log('4. 创建新查询，粘贴上面的 SQL');
console.log('5. 点击 "Run" 执行');
console.log('6. 执行成功后，运行: npm run update:categories:aliexpress\n');
