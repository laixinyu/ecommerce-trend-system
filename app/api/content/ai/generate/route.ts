import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIContentGenerator } from '@/lib/content/ai-generator';

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

    const body = await request.json();
    const { type, product, options } = body;

    if (!type || !product) {
      return NextResponse.json(
        { error: 'Missing required fields: type, product' },
        { status: 400 }
      );
    }

    const generator = new AIContentGenerator();
    let result: string | string[] | { caption?: string; hashtags?: string[]; subject?: string; body?: string };

    switch (type) {
      case 'product_description':
        result = await generator.generateProductDescription(product, options);
        break;

      case 'ad_copy':
        const { platform, variations = 3 } = options || {};
        if (!platform) {
          return NextResponse.json(
            { error: 'Platform required for ad copy generation' },
            { status: 400 }
          );
        }
        result = await generator.generateAdCopy(product, platform, variations, options);
        break;

      case 'social_post':
        const { platform: socialPlatform, tone = 'casual' } = options || {};
        if (!socialPlatform) {
          return NextResponse.json(
            { error: 'Platform required for social post generation' },
            { status: 400 }
          );
        }
        result = await generator.generateSocialPost(product, socialPlatform, tone, options);
        break;

      case 'email':
        const { emailType = 'promotional' } = options || {};
        result = await generator.generateEmailContent(product, emailType, options);
        break;

      case 'improve':
        const { content, contentType, improvements } = options || {};
        if (!content || !contentType) {
          return NextResponse.json(
            { error: 'Content and contentType required for improvement' },
            { status: 400 }
          );
        }
        result = await generator.improveContent(content, contentType, improvements, options);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown generation type: ${type}` },
          { status: 400 }
        );
    }

    // Save generated content to database
    const { error: saveError } = await (supabase
      .from('ai_generated_content') as unknown)
      .insert({
        user_id: user.id,
        type: type as string,
        prompt: JSON.stringify({ product, options }),
        content: typeof result === 'string' ? result : JSON.stringify(result),
        model: (options?.model as string) || 'gpt-3.5-turbo',
      });

    if (saveError) {
      console.error('Failed to save generated content:', saveError);
      // Don't fail the request if saving fails
    }

    return NextResponse.json({
      success: true,
      content: result,
      type,
    });
  } catch (error) {
    const err = error as Error;
    console.error('AI content generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
