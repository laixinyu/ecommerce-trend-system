# 测试账号信息

## 📋 可用的测试账号

以下测试账号已经在系统中创建,可以直接使用:

### 1. 普通测试账号
```
邮箱: test@example.com
密码: Test123456!
用途: 日常功能测试
```

### 2. 管理员账号
```
邮箱: admin@example.com
密码: Admin123456!
用途: 管理员功能测试
```

### 3. 演示账号
```
邮箱: demo@example.com
密码: Demo123456!
用途: 演示和展示
```

## 🔐 登录步骤

1. 启动开发服务器:
   ```bash
   npm run dev
   ```

2. 访问登录页面:
   ```
   http://localhost:3000/login
   ```

3. 输入上述任一账号的邮箱和密码

4. 点击"登录"按钮

## ✅ 登录后可以访问的功能

### Dashboard (仪表板)
- URL: `/dashboard`
- 查看所有功能模块的入口

### 营销数字化
- URL: `/marketing`
- 广告活动分析、ROAS计算、SEO数据

### 用户增长
- URL: `/growth`
- RFM客户分析、自动化营销、客户洞察

### 内容运营
- URL: `/content`
- AI内容生成、资产管理、社媒分析

### 供应链管理
- URL: `/supply-chain`
- 库存管理、订单追踪、物流监控

### 智能决策中心
- URL: `/intelligence`
- 自定义仪表板、AI预测、自动化工作流

### 集成管理
- URL: `/integrations`
- 管理第三方平台连接

### 模块管理
- URL: `/modules`
- 启用/禁用功能模块

## 🔄 重新创建账号

如果需要重新创建或重置密码,运行:

```bash
npm run create:test-user
```

脚本会自动检测已存在的账号并更新密码。

## ⚠️ 注意事项

1. **仅用于开发测试** - 这些账号仅用于本地开发和测试
2. **不要用于生产** - 生产环境应该使用真实的用户注册流程
3. **密码安全** - 测试密码很简单,生产环境应使用强密码
4. **定期清理** - 测试完成后可以删除这些账号

## 🐛 故障排除

### 问题: 无法登录
- 确保开发服务器正在运行
- 检查Supabase配置是否正确
- 运行 `npm run test:supabase` 测试连接

### 问题: 登录后显示Unauthorized
- 运行数据库迁移: `npm run migration:007`
- 检查RLS策略配置

### 问题: 忘记密码
- 重新运行 `npm run create:test-user` 重置密码

## 📞 需要帮助?

查看以下文档:
- [快速开始指南](./QUICK_START.md)
- [测试指南](./docs/TESTING_GUIDE.md)
- [架构文档](./docs/ARCHITECTURE.md)
