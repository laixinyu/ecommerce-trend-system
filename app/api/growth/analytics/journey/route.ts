// 用户行为路径分析API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserJourney, UserJourneyStep } from '@/types/analytics';

/**
 * GET /api/growth/analytics/journey
 * 获取用户行为路径
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const sessionId = searchParams.get('session_id');

    if (!customerId && !sessionId) {
      return NextResponse.json(
        { error: 'customer_id or session_id is required' },
        { status: 400 }
      );
    }

    // 构建查询
    let query = supabase
      .from('user_events')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ journeys: [] });
    }

    // 按session分组构建用户旅程
    const sessionMap = new Map<string, UserJourney>();

    events.forEach((event, index) => {
      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, {
          customer_id: event.customer_id || 'anonymous',
          session_id: event.session_id,
          steps: [],
          total_duration: 0,
          converted: false,
        });
      }

      const journey = sessionMap.get(event.session_id)!;
      const previousStep = journey.steps[journey.steps.length - 1];

      const step: UserJourneyStep = {
        step_number: journey.steps.length + 1,
        event_name: event.event_name,
        page_url: event.page_url,
        timestamp: event.timestamp,
        time_from_previous: previousStep
          ? new Date(event.timestamp).getTime() -
            new Date(previousStep.timestamp).getTime()
          : 0,
      };

      journey.steps.push(step);

      // 检查是否转化（购买事件）
      if (event.event_name === 'purchase' || event.event_type === 'purchase') {
        journey.converted = true;
      }
    });

    // 计算总时长
    sessionMap.forEach((journey) => {
      if (journey.steps.length > 1) {
        const firstStep = journey.steps[0];
        const lastStep = journey.steps[journey.steps.length - 1];
        journey.total_duration =
          new Date(lastStep.timestamp).getTime() -
          new Date(firstStep.timestamp).getTime();
      }
    });

    const journeys = Array.from(sessionMap.values());

    return NextResponse.json({ journeys });
  } catch (error: any) {
    console.error('Get user journey error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user journey' },
      { status: 500 }
    );
  }
}
