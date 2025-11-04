import { NextRequest, NextResponse } from 'next/server';
import { generateReport, type ReportParams } from '@/lib/analytics/report-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const params: ReportParams = {
      categories: body.categories || [],
      platforms: body.platforms || [],
      dateRange: parseInt(body.dateRange) || 30,
      template: body.template || 'trend-overview',
    };

    console.log('生成报告，参数:', params);

    // 生成真实的报告数据
    const reportData = await generateReport(params);

    // 生成报告ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('报告生成成功:', reportId);

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        reportData,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      },
      { status: 500 }
    );
  }
}
