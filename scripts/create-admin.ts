/**
 * 创建管理员账号脚本
 * 使用方法: npm run create:admin
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createAdmin() {
  console.log('🔐 创建管理员账号\n');

  let email = '';
  while (!email || !isValidEmail(email)) {
    email = await question('📧 请输入管理员邮箱: ');
    if (!isValidEmail(email)) {
      console.log('❌ 邮箱格式不正确\n');
    }
  }

  let password = '';
  while (!password || password.length < 8) {
    password = await question('🔑 请输入密码 (至少8个字符): ');
    if (password.length < 8) {
      console.log('❌ 密码至少需要8个字符\n');
    }
  }

  const name = (await question('👤 请输入姓名 (可选): ')) || '管理员';

  console.log('\n确认信息:');
  console.log(`邮箱: ${email}`);
  console.log(`姓名: ${name}\n`);

  const confirm = await question('确认创建? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('已取消');
    rl.close();
    process.exit(0);
  }

  console.log('\n🚀 正在创建...\n');

  try {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find((u) => u.email === email);

    if (existingUser) {
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { name, role: 'admin' },
      });

      if (error) throw error;
      console.log('✅ 管理员账号更新成功!');
      console.log(`用户ID: ${existingUser.id}\n`);
    } else {
      const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'admin' },
      });

      if (error) throw error;
      console.log('✅ 管理员账号创建成功!');
      console.log(`用户ID: ${user.user?.id}\n`);
    }

    console.log('📋 登录信息:');
    console.log(`邮箱: ${email}`);
    console.log(`密码: ${password}\n`);
  } catch (error: any) {
    console.error('❌ 创建失败:', error.message);
  } finally {
    rl.close();
  }
}

createAdmin();
