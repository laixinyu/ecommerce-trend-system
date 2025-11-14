# Scripts 目录

这个目录包含项目的实用脚本。

## 可用脚本

### 数据库初始化

**seed-database.ts**
- 命令: `npm run seed`
- 功能: 初始化数据库，填充示例商品数据
- 使用场景: 首次设置或重置数据库

### 管理员管理

**create-admin.ts**
- 命令: `npm run create:admin`
- 功能: 交互式创建管理员账号
- 使用场景: 创建新的管理员用户或重置管理员密码

### 连接测试

**test-supabase-connection.ts**
- 命令: `npm run test:supabase`
- 功能: 测试 Supabase 数据库连接
- 使用场景: 验证环境变量配置是否正确

## 使用说明

所有脚本都需要正确配置 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 常见工作流

### 首次设置
```bash
npm run test:supabase    # 1. 测试连接
npm run seed             # 2. 初始化数据
npm run create:admin     # 3. 创建管理员
```

### 生产环境设置
```bash
# 修改 .env.local 指向生产环境
npm run create:admin     # 创建管理员账号
```
