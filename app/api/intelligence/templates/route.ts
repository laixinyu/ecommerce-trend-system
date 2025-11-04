import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardTemplate } from '@/types/intelligence';

// Predefined dashboard templates
const TEMPLATES: DashboardTemplate[] = [
  {
    id: 'overview',
    name: '全局概览',
    description: '展示所有模块的关键指标',
    category: 'general',
    layout: {
      columns: 12,
      gap: 4,
      responsive: true,
    },
    widgets: [
      {
        type: 'metric',
        title: '营销总支出',
        data_source: {
          module: 'marketing',
          endpoint: 'campaigns',
          aggregation: 'sum',
        },
        config: {
          format: 'currency',
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      {
        type: 'metric',
        title: '总客户数',
        data_source: {
          module: 'growth',
          endpoint: 'customers',
          aggregation: 'count',
        },
        config: {
          format: 'number',
        },
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      {
        type: 'metric',
        title: '内容资产',
        data_source: {
          module: 'content',
          endpoint: 'assets',
          aggregation: 'count',
        },
        config: {
          format: 'number',
        },
        position: { x: 6, y: 0, w: 3, h: 2 },
      },
      {
        type: 'metric',
        title: '库存总值',
        data_source: {
          module: 'supply-chain',
          endpoint: 'inventory',
          aggregation: 'sum',
        },
        config: {
          format: 'currency',
        },
        position: { x: 9, y: 0, w: 3, h: 2 },
      },
      {
        type: 'chart',
        title: '营销ROI趋势',
        data_source: {
          module: 'marketing',
          endpoint: 'campaigns',
        },
        config: {
          chartType: 'line',
          showLegend: true,
        },
        position: { x: 0, y: 2, w: 6, h: 4 },
      },
      {
        type: 'chart',
        title: '客户分层分布',
        data_source: {
          module: 'growth',
          endpoint: 'customers',
        },
        config: {
          chartType: 'pie',
          showLegend: true,
        },
        position: { x: 6, y: 2, w: 6, h: 4 },
      },
    ],
  },
  {
    id: 'marketing',
    name: '营销仪表板',
    description: '专注于营销数据和广告效果',
    category: 'marketing',
    layout: {
      columns: 12,
      gap: 4,
      responsive: true,
    },
    widgets: [
      {
        type: 'metric',
        title: 'ROAS',
        data_source: {
          module: 'marketing',
          endpoint: 'campaigns',
        },
        config: {
          format: 'number',
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      {
        type: 'metric',
        title: '活跃广告',
        data_source: {
          module: 'marketing',
          endpoint: 'campaigns',
          aggregation: 'count',
        },
        config: {
          format: 'number',
        },
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      {
        type: 'chart',
        title: '广告支出趋势',
        data_source: {
          module: 'marketing',
          endpoint: 'campaigns',
        },
        config: {
          chartType: 'area',
          showLegend: true,
        },
        position: { x: 0, y: 2, w: 12, h: 4 },
      },
      {
        type: 'table',
        title: '广告活动列表',
        data_source: {
          module: 'marketing',
          endpoint: 'campaigns',
        },
        config: {},
        position: { x: 0, y: 6, w: 12, h: 4 },
      },
    ],
  },
  {
    id: 'growth',
    name: '用户增长仪表板',
    description: '客户数据和增长指标',
    category: 'growth',
    layout: {
      columns: 12,
      gap: 4,
      responsive: true,
    },
    widgets: [
      {
        type: 'metric',
        title: '总客户数',
        data_source: {
          module: 'growth',
          endpoint: 'customers',
          aggregation: 'count',
        },
        config: {
          format: 'number',
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      {
        type: 'metric',
        title: '平均LTV',
        data_source: {
          module: 'growth',
          endpoint: 'customers',
          aggregation: 'avg',
        },
        config: {
          format: 'currency',
        },
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      {
        type: 'chart',
        title: 'RFM分层',
        data_source: {
          module: 'growth',
          endpoint: 'customers',
        },
        config: {
          chartType: 'bar',
          showLegend: true,
        },
        position: { x: 0, y: 2, w: 6, h: 4 },
      },
      {
        type: 'chart',
        title: '客户增长趋势',
        data_source: {
          module: 'growth',
          endpoint: 'customers',
        },
        config: {
          chartType: 'line',
          showLegend: true,
        },
        position: { x: 6, y: 2, w: 6, h: 4 },
      },
    ],
  },
  {
    id: 'supply-chain',
    name: '供应链仪表板',
    description: '库存和订单管理',
    category: 'supply-chain',
    layout: {
      columns: 12,
      gap: 4,
      responsive: true,
    },
    widgets: [
      {
        type: 'metric',
        title: '库存总值',
        data_source: {
          module: 'supply-chain',
          endpoint: 'inventory',
          aggregation: 'sum',
        },
        config: {
          format: 'currency',
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      {
        type: 'metric',
        title: '低库存SKU',
        data_source: {
          module: 'supply-chain',
          endpoint: 'inventory',
        },
        config: {
          format: 'number',
          threshold: {
            warning: 10,
            critical: 5,
          },
        },
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      {
        type: 'metric',
        title: '待处理订单',
        data_source: {
          module: 'supply-chain',
          endpoint: 'orders',
          aggregation: 'count',
        },
        config: {
          format: 'number',
        },
        position: { x: 6, y: 0, w: 3, h: 2 },
      },
      {
        type: 'table',
        title: '库存预警',
        data_source: {
          module: 'supply-chain',
          endpoint: 'inventory',
        },
        config: {},
        position: { x: 0, y: 2, w: 12, h: 4 },
      },
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let templates = TEMPLATES;
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { template_id, name } = body;

    const template = TEMPLATES.find(t => t.id === template_id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create dashboard from template
    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        user_id: user.id,
        name: name || template.name,
        description: template.description,
        layout: template.layout,
        widgets: template.widgets,
        is_default: false,
        is_template: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dashboard from template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ dashboard: data }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
