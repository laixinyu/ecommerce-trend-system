// 调度器控制API
import { NextRequest, NextResponse } from 'next/server';
import { crawlScheduler } from '@/lib/crawler/scheduler';
import { createClient } from '@/lib/supabase/server';

// 获取调度器状态
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = crawlScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

// 控制调度器（启动/停止）
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, platform, config } = body;

    switch (action) {
      case 'start':
        crawlScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Scheduler started',
        });

      case 'stop':
        crawlScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped',
        });

      case 'update':
        if (!platform || !config) {
          return NextResponse.json(
            { error: 'Platform and config are required' },
            { status: 400 }
          );
        }
        crawlScheduler.updateSchedule(platform, config);
        return NextResponse.json({
          success: true,
          message: 'Schedule updated',
        });

      case 'trigger':
        if (!platform) {
          return NextResponse.json(
            { error: 'Platform is required' },
            { status: 400 }
          );
        }
        const taskId = await crawlScheduler.triggerManualCrawl(
          platform,
          body.category,
          body.keywords
        );
        return NextResponse.json({
          success: true,
          taskId,
          message: 'Manual crawl triggered',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Scheduler control error:', error);
    return NextResponse.json(
      { error: 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}
