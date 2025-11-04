/**
 * 创建测试用户脚本
 * 用于本地开发和调试
 * 
 * 使用方法:
 * npm run create:test-user
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 使用 Service Role Key 创建管理员客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  console.log('🚀 开始创建测试用户...\n');

  const testUsers = [
    {
      email: 'test@example.com',
      password: 'Test123456!',
      name: '测试用户',
    },
    {
      email: 'admin@example.com',
      password: 'Admin123456!',
      name: '管理员',
    },
    {
      email: 'demo@example.com',
      password: 'Demo123456!',
      name: '演示账号',
    },
  ];

  for (const userData of testUsers) {
    try {
      console.log(`📝 创建用户: ${userData.email}`);

      // 创建用户
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // 自动确认邮箱
        user_metadata: {
          name: userData.name,
        },
      });

      if (createError) {
        if (createError.message.includes('already registered')) {
          console.log(`   ⚠️  用户已存在,跳过创建`);
          
          // 尝试更新密码
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users.users.find(u => u.email === userData.email);
          
          if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: userData.password }
            );
            
            if (!updateError) {
              console.log(`   ✅ 已更新密码`);
            }
          }
        } else {
          throw createError;
        }
      } else {
        console.log(`   ✅ 用户创建成功`);
        console.log(`   📧 邮箱: ${userData.email}`);
        console.log(`   🔑 密码: ${userData.password}`);
        console.log(`   👤 用户ID: ${user.user?.id}`);
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ 创建失败:`, error);
      console.log('');
    }
  }

  console.log('✨ 测试用户创建完成!\n');
  console.log('📋 可用的测试账号:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testUsers.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.name}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   密码: ${user.password}`);
  });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 提示:');
  console.log('   1. 访问 http://localhost:3000/login 登录');
  console.log('   2. 使用上述任一账号进行测试');
  console.log('   3. 登录后可以访问所有功能模块\n');
}

// 执行脚本
createTestUser()
  .then(() => {
    console.log('✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
