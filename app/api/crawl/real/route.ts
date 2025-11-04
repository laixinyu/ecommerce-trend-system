/**
 * 真实爬虫 API
 * POST /api/crawl/real - 触发真实的网页爬取
 */

import { NextRequest, NextResponse } from 'next/server';
import { crawlerManager, type Platform } from '@/lib/crawler/crawler-manager';

export const maxDuration = 300; // 5 分钟超时

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, keyword, categoryId, maxPages = 2 } = body;

    // 验证参数
    if (!platform || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required parameters: platform, categoryId' },
        { status: 400 }
      );
    }

    if (!['amazon', 'aliexpress'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "amazon" or "aliexpress"' },
        { status: 400 }
      );
    }

    console.log(`Starting real crawl: ${platform} - ${keyword || 'category browse'}`);

    // 执行爬取任务
    const result = await crawlerManager.executeCrawlTask({
      platform: platform as Platform,
      keyword: keyword || '', // 空字符串表示按类目浏览
      categoryId,
      maxPages: Math.min(maxPages, 5), // 限制最多 5 页
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully crawled ${result.productsSaved} products`,
        data: result,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          data: result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Real crawl API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 批量爬取
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tasks array' },
        { status: 400 }
      );
    }

    // 限制批量任务数量
    if (tasks.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 tasks allowed per batch' },
        { status: 400 }
      );
    }

    console.log(`Starting batch crawl: ${tasks.length} tasks`);

    const results = await crawlerManager.executeCrawlTasks(tasks);

    const successCount = results.filter(r => r.success).length;
    const totalProducts = results.reduce((sum, r) => sum + r.productsSaved, 0);

    return NextResponse.json({
      success: true,
      message: `Completed ${successCount}/${tasks.length} tasks, saved ${totalProducts} products`,
      data: {
        results,
        summary: {
          totalTasks: tasks.length,
          successfulTasks: successCount,
          failedTasks: tasks.length - successCount,
          totalProducts,
        },
      },
    });
  } catch (error) {
    console.error('Batch crawl API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 获取爬取统计
 */
export async function GET() {
  try {
    const stats = await crawlerManager.getCrawlStats(7);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get crawl stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
