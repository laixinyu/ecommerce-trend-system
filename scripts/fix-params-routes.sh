#!/bin/bash

# 批量修复 Next.js 15+ params Promise 问题的脚本

echo "开始批量修复 API 路由文件..."

# 定义需要修复的文件列表
files=(
  "app/api/intelligence/workflows/[id]/route.ts"
  "app/api/intelligence/workflows/[id]/execute/route.ts"
  "app/api/intelligence/alerts/[id]/resolve/route.ts"
  "app/api/intelligence/alerts/[id]/acknowledge/route.ts"
  "app/api/intelligence/export/[id]/route.ts"
  "app/api/intelligence/dashboards/[id]/route.ts"
  "app/api/modules/[id]/route.ts"
  "app/api/integrations/[id]/route.ts"
  "app/api/integrations/[id]/refresh-token/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "修复: $file"
    
    # 1. 修复参数类型定义
    sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
    
    # 2. 在函数开头添加 await params（需要手动检查位置）
    echo "  - 已更新参数类型，请手动添加 'const { id } = await params;'"
  else
    echo "跳过: $file (文件不存在)"
  fi
done

echo "批量修复完成！请手动检查并添加 'const { id } = await params;'"
