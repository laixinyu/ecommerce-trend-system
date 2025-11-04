// SEO数据API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIntegrationCredentials } from '@/lib/integrations/integration-helper';
import { GoogleSearchConsoleClient } from '@/lib/integrations/clients/google-search-console-client';

/**
 * GET /api/marketing/seo
 * 获取SEO数据
 */
export async function GET(request: NextRequest) {
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

    // 查询参数
    const searchParams = request.nextUrl.searchParams;
    const siteUrl = searchParams.get('site_url');
    const dataType = searchParams.get('type') || 'summary'; // summary, queries, pages, devices, countries
    const startDate =
      searchParams.get('start_date') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const endDate =
      searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'site_url is required' },
        { status: 400 }
      );
    }

    // 查找Google Search Console集成
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_name', 'google_search_console')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Google Search Console integration not found' },
        { status: 404 }
      );
    }

    // 获取凭证
    const credentials = await getIntegrationCredentials(integration.id, user.id);
    const client = new GoogleSearchConsoleClient(credentials.access_token);

    const dateRange = { startDate, endDate };

    // 根据类型返回不同的数据
    let data;
    switch (dataType) {
      case 'summary':
        data = await client.getSummaryData(siteUrl, dateRange);
        break;

      case 'queries':
        const limit = parseInt(searchParams.get('limit') || '100');
        data = await client.getTopQueries(siteUrl, dateRange, limit);
        break;

      case 'pages':
        const pageLimit = parseInt(searchParams.get('limit') || '100');
        data = await client.getTopPages(siteUrl, dateRange, pageLimit);
        break;

      case 'devices':
        data = await client.getDataByDevice(siteUrl, dateRange);
        break;

      case 'countries':
        const countryLimit = parseInt(searchParams.get('limit') || '50');
        data = await client.getDataByCountry(siteUrl, dateRange, countryLimit);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid data type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      site_url: siteUrl,
      type: dataType,
      date_range: dateRange,
      data,
    });
  } catch (error) {
    console.error('Error in GET /api/marketing/seo:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
