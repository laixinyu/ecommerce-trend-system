// A/B测试API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { abTestingAnalytics } from '@/lib/analytics/ab-testing';
import type { ABTest } from '@/lib/analytics/ab-testing';

/**
 * POST /api/marketing/ab-tests
 * 分析A/B测试结果
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const { action, test_data } = body;

    switch (action) {
      case 'analyze':
        // 分析测试结果
        if (!test_data) {
          return NextResponse.json(
            { error: 'test_data is required' },
            { status: 400 }
          );
        }
        const result = abTestingAnalytics.analyzeTestResults(
          test_data as ABTest
        );
        return NextResponse.json({ result });

      case 'calculate_sample_size':
        // 计算所需样本量
        const {
          baseline_conversion_rate,
          minimum_detectable_effect,
          significance,
          power,
        } = body;

        if (!baseline_conversion_rate || !minimum_detectable_effect) {
          return NextResponse.json(
            {
              error:
                'baseline_conversion_rate and minimum_detectable_effect are required',
            },
            { status: 400 }
          );
        }

        const sampleSize =
          abTestingAnalytics.calculateRequiredSampleSize(
            baseline_conversion_rate,
            minimum_detectable_effect,
            significance,
            power
          );

        return NextResponse.json({
          required_sample_size: sampleSize,
          per_variant: Math.ceil(sampleSize / 2),
        });

      case 'check_completion':
        // 检查测试是否可以结束
        if (!test_data) {
          return NextResponse.json(
            { error: 'test_data is required' },
            { status: 400 }
          );
        }

        const { min_confidence, min_sample_size } = body;
        const canEnd = abTestingAnalytics.canEndTest(
          test_data as ABTest,
          min_confidence,
          min_sample_size
        );

        return NextResponse.json(canEnd);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in POST /api/marketing/ab-tests:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
