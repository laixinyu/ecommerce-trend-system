import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DataExporter } from '@/lib/intelligence/data-exporter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data_source, filters } = body;

    if (!type || !data_source) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data_source' },
        { status: 400 }
      );
    }

    const exporter = new DataExporter(supabase, user.id);
    const job = await exporter.createExportJob(type, data_source, filters);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating export job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exporter = new DataExporter(supabase, user.id);
    const jobs = await exporter.listExportJobs();

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error listing export jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
