// Vercel Cron Job端点 - 定时触发数据采集
import { NextRequest, NextResponse } from 'next/server';
import { crawlScheduler } from '@/lib/crawler/scheduler';

// 验证Cron请求
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return true; // 开发环境允许
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// Vercel Cron Job会定期调用此端点
export async function GET(request: NextRequest) {
  try {
    // 验证请求来源
    if (!verifyCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cron job triggered at:', new Date().toISOString());

    // 确保调度器正在运行
    const status = crawlScheduler.getStatus();
    if (!status.isRunning) {
      crawlScheduler.start();
      console.log('Scheduler started by cron job');
    }

    // 获取当前队列状态
    const queueStatus = crawlScheduler.getStatus();

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString(),
      schedulerStatus: queueStatus,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 支持POST请求（用于手动触发）
export async function POST(request: NextRequest) {
  return GET(request);
}
