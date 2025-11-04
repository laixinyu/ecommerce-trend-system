import { NextRequest, NextResponse } from 'next/server';
import { crawlScheduler } from '@/lib/crawler/scheduler';

export async function GET(request: NextRequest) {
  try {
    // 验证 cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting product update...');

    // 触发所有平台的爬取
    const platforms = ['amazon', 'aliexpress'] as const;
    const categories = ['电子产品', '家居用品', '服装配饰'];
    
    const tasks: string[] = [];
    
    for (const platform of platforms) {
      for (const category of categories) {
        const taskId = await crawlScheduler.triggerManualCrawl(platform, category);
        tasks.push(taskId);
      }
    }

    console.log(`[CRON] Created ${tasks.length} crawl tasks`);

    return NextResponse.json({
      success: true,
      message: 'Product update triggered',
      data: {
        tasksCreated: tasks.length,
        taskIds: tasks,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[CRON] Product update failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      },
      { status: 500 }
    );
  }
}
