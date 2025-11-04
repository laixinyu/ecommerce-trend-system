/**
 * 验证测试用户脚本
 * 检查测试用户是否已成功创建
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyTestUsers() {
  console.log('🔍 开始验证测试用户...\n');

  const testEmails = [
    'test@example.com',
    'admin@example.com',
    'demo@example.com',
  ];

  try {
    // 获取所有用户
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    console.log(`📊 数据库中共有 ${users.length} 个用户\n`);

    // 检查测试用户
    console.log('✅ 测试用户状态:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const email of testEmails) {
      const user = users.find(u => u.email === email);
      
      if (user) {
        console.log(`\n✓ ${email}`);
        console.log(`  用户ID: ${user.id}`);
        console.log(`  创建时间: ${new Date(user.created_at).toLocaleString('zh-CN')}`);
        console.log(`  邮箱已确认: ${user.email_confirmed_at ? '是' : '否'}`);
        console.log(`  最后登录: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-CN') : '从未登录'}`);
        
        if (user.user_metadata?.name) {
          console.log(`  用户名: ${user.user_metadata.name}`);
        }
      } else {
        console.log(`\n✗ ${email} - 未找到`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const foundCount = testEmails.filter(email => 
      users.some(u => u.email === email)
    ).length;

    console.log(`\n📈 结果: ${foundCount}/${testEmails.length} 个测试用户已创建`);

    if (foundCount === testEmails.length) {
      console.log('✅ 所有测试用户都已成功创建!\n');
    } else {
      console.log('⚠️  部分测试用户未创建,请运行: npm run create:test-user\n');
    }

  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

verifyTestUsers()
  .then(() => {
    console.log('✅ 验证完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
