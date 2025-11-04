import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!keyword) {
      return NextResponse.json(
        { error: '关键词不能为空' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 查找包含该关键词的商品
    // 使用 ilike 进行模糊搜索，避免特殊字符导致的 SQL 错误
    const { data: products, error } = await supabase
      .from('products')
      .select('name, platform, category_id')
      .ilike('name', `%${keyword}%`)
      .limit(50);

    if (error) {
      console.error('获取相关关键词错误:', error);
      return NextResponse.json(
        { error: '获取相关关键词失败' },
        { status: 500 }
      );
    }

    // 从商品名称中提取关键词
    const keywordFrequency = new Map<string, number>();
    const categorySet = new Set<string>();
    const platformSet = new Set<string>();

    products?.forEach((product: unknown) => {
      // 从商品名称中提取单词作为相关关键词
      const words = product.name
        .toLowerCase()
        .split(/[\s,\-_]+/)
        .filter((word: string) => word.length > 2 && !keyword.toLowerCase().includes(word));
      
      words.forEach((word: string) => {
        keywordFrequency.set(word, (keywordFrequency.get(word) || 0) + 1);
      });

      if (product.category_id) {
        categorySet.add(product.category_id);
      }
      if (product.platform) {
        platformSet.add(product.platform);
      }
    });

    // 按频率排序并取前N个
    const relatedKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([kw, freq]) => ({
        keyword: kw,
        frequency: freq,
        relevance: Math.min(100, Math.round((freq / (products?.length || 1)) * 100)),
      }));

    return NextResponse.json({
      keyword,
      related: relatedKeywords,
      categories: Array.from(categorySet),
      platforms: Array.from(platformSet),
      totalProducts: products?.length || 0,
    });
  } catch (error) {
    console.error('获取相关关键词异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
