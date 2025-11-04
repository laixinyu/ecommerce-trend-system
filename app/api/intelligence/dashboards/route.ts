import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Dashboard } from '@/types/intelligence';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeTemplates = searchParams.get('include_templates') === 'true';

    let query = supabase
      .from('dashboards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (includeTemplates) {
      query = query.or(`is_template.eq.true,user_id.eq.${user.id}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dashboards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ dashboards: data });
  } catch (error: any) {
    console.error('Unexpected error:', error);
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
    const { name, description, layout, widgets, is_default } = body;

    if (!name || !layout || !widgets) {
      return NextResponse.json(
        { error: 'Missing required fields: name, layout, widgets' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('dashboards')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        user_id: user.id,
        name,
        description,
        layout,
        widgets,
        is_default: is_default || false,
        is_template: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dashboard:', error);
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
