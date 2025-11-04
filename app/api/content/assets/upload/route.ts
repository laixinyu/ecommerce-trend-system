import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const platform = formData.get('platform') as string;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `content-assets/${fileName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-assets')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('content-assets')
      .getPublicUrl(filePath);

    // Create content asset record
    const { data: asset, error: insertError } = await supabase
      .from('content_assets')
      .insert({
        user_id: user.id,
        type: type || 'image',
        title: title || file.name,
        description: description || '',
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        platform: platform || 'meta',
        url: urlData.publicUrl,
        storage_path: filePath,
        metrics: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagement_rate: 0,
          reach: 0,
          date: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      // Clean up uploaded file
      await supabase.storage.from('content-assets').remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to create content asset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (error: any) {
    console.error('Upload content asset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload content asset' },
      { status: 500 }
    );
  }
}
