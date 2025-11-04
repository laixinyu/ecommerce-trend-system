import axios from 'axios';
import { Logger } from '@/lib/utils/logger';

export interface Product {
  name: string;
  category: string;
  price: number;
  features: string[];
  description?: string;
  targetAudience?: string;
}

export interface GenerationOptions {
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet';
  temperature?: number;
  maxTokens?: number;
}

export class AIContentGenerator {
  private openaiApiKey: string;
  private anthropicApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';
  }

  /**
   * Generate product description
   */
  async generateProductDescription(
    product: Product,
    options: GenerationOptions = {}
  ): Promise<string> {
    const prompt = `
Generate a compelling product description for an e-commerce listing:

Product Name: ${product.name}
Category: ${product.category}
Price: $${product.price}
Key Features: ${product.features.join(', ')}
${product.targetAudience ? `Target Audience: ${product.targetAudience}` : ''}

Requirements:
- Highlight unique selling points
- Include emotional appeal
- SEO-friendly with relevant keywords
- Professional and engaging tone
- 150-200 words
- Focus on benefits, not just features

Generate the product description:
    `.trim();

    return await this.generate(prompt, options);
  }

  /**
   * Generate ad copy variations for A/B testing
   */
  async generateAdCopy(
    product: Product,
    platform: 'facebook' | 'google' | 'tiktok' | 'instagram',
    variations: number = 3,
    options: GenerationOptions = {}
  ): Promise<string[]> {
    const platformGuidelines = {
      facebook: 'Facebook Ads (125 characters headline, 2-3 sentences body)',
      google: 'Google Ads (30 characters headline, 90 characters description)',
      tiktok: 'TikTok Ads (catchy, trendy, youth-oriented, 100 characters)',
      instagram: 'Instagram Ads (visual-focused, hashtag-friendly, 125 characters)',
    };

    const prompt = `
Generate ${variations} different ad copy variations for ${platformGuidelines[platform]}:

Product: ${product.name}
Category: ${product.category}
Price: $${product.price}
Key Features: ${product.features.join(', ')}
${product.targetAudience ? `Target Audience: ${product.targetAudience}` : ''}

Requirements:
- Each variation should have a different angle (e.g., feature-focused, benefit-focused, urgency-driven)
- Include a clear call-to-action
- Optimize for ${platform} best practices
- Make them suitable for A/B testing

Format: Return each variation numbered (1., 2., 3., etc.) on separate lines.

Generate the ad copy variations:
    `.trim();

    const response = await this.generate(prompt, options);
    
    // Parse variations
    const variations_list = response
      .split(/\d+\.\s+/)
      .filter(v => v.trim().length > 0)
      .map(v => v.trim());

    return variations_list.slice(0, variations);
  }

  /**
   * Generate social media post
   */
  async generateSocialPost(
    product: Product,
    platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter',
    tone: 'professional' | 'casual' | 'humorous' | 'inspirational' = 'casual',
    options: GenerationOptions = {}
  ): Promise<{ caption: string; hashtags: string[] }> {
    const platformGuidelines = {
      facebook: 'Facebook post (engaging, conversational, 1-2 paragraphs)',
      instagram: 'Instagram caption (visual-focused, emoji-friendly, storytelling)',
      tiktok: 'TikTok caption (trendy, catchy, youth-oriented)',
      twitter: 'Twitter/X post (concise, impactful, 280 characters max)',
    };

    const prompt = `
Generate a ${tone} social media post for ${platformGuidelines[platform]}:

Product: ${product.name}
Category: ${product.category}
Price: $${product.price}
Key Features: ${product.features.join(', ')}
${product.targetAudience ? `Target Audience: ${product.targetAudience}` : ''}

Requirements:
- ${tone} tone
- Engaging and shareable
- Include a call-to-action
- Suggest 5-10 relevant hashtags
- Optimize for ${platform}

Format:
Caption: [your caption here]
Hashtags: #hashtag1 #hashtag2 #hashtag3 ...

Generate the social media post:
    `.trim();

    const response = await this.generate(prompt, options);
    
    // Parse caption and hashtags
    const captionMatch = response.match(/Caption:\s*(.+?)(?=Hashtags:|$)/s);
    const hashtagsMatch = response.match(/Hashtags:\s*(.+)/s);

    const caption = captionMatch ? captionMatch[1].trim() : response;
    const hashtagsText = hashtagsMatch ? hashtagsMatch[1].trim() : '';
    const hashtags = hashtagsText
      .split(/\s+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.substring(1));

    return { caption, hashtags };
  }

  /**
   * Generate email marketing content
   */
  async generateEmailContent(
    product: Product,
    emailType: 'promotional' | 'abandoned_cart' | 'product_launch' | 'newsletter',
    options: GenerationOptions = {}
  ): Promise<{ subject: string; body: string }> {
    const emailTypeDescriptions = {
      promotional: 'promotional email with special offer',
      abandoned_cart: 'abandoned cart recovery email',
      product_launch: 'new product launch announcement',
      newsletter: 'newsletter featuring this product',
    };

    const prompt = `
Generate a ${emailTypeDescriptions[emailType]} for e-commerce:

Product: ${product.name}
Category: ${product.category}
Price: $${product.price}
Key Features: ${product.features.join(', ')}
${product.targetAudience ? `Target Audience: ${product.targetAudience}` : ''}

Requirements:
- Compelling subject line (50 characters max)
- Engaging email body (200-300 words)
- Clear call-to-action
- Professional yet friendly tone
- Mobile-friendly formatting

Format:
Subject: [subject line]
Body: [email body]

Generate the email content:
    `.trim();

    const response = await this.generate(prompt, options);
    
    // Parse subject and body
    const subjectMatch = response.match(/Subject:\s*(.+?)(?=Body:|$)/s);
    const bodyMatch = response.match(/Body:\s*(.+)/s);

    const subject = subjectMatch ? subjectMatch[1].trim() : 'Special Offer';
    const body = bodyMatch ? bodyMatch[1].trim() : response;

    return { subject, body };
  }

  /**
   * Improve existing content
   */
  async improveContent(
    content: string,
    contentType: 'description' | 'ad_copy' | 'social_post',
    improvements: string[] = ['clarity', 'engagement', 'seo'],
    options: GenerationOptions = {}
  ): Promise<string> {
    const prompt = `
Improve the following ${contentType} by focusing on: ${improvements.join(', ')}

Original Content:
${content}

Requirements:
- Maintain the core message
- Enhance ${improvements.join(', ')}
- Keep similar length
- Make it more compelling

Generate the improved content:
    `.trim();

    return await this.generate(prompt, options);
  }

  /**
   * Generate content using specified AI model
   */
  private async generate(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    const model = options.model || 'gpt-3.5-turbo';
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 500;

    if (model.startsWith('gpt')) {
      return await this.generateWithOpenAI(prompt, model, temperature, maxTokens);
    } else if (model.startsWith('claude')) {
      return await this.generateWithClaude(prompt, model, temperature, maxTokens);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  }

  /**
   * Generate using OpenAI API
   */
  private async generateWithOpenAI(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const start = Date.now();

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert e-commerce copywriter and content creator.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      Logger.apiCall('openai', 'chat.completions', Date.now() - start);

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      const err = error as Error;
      Logger.error('OpenAI API error', err);
      throw new Error(`OpenAI API error: ${err.message}`);
    }
  }

  /**
   * Generate using Claude API
   */
  private async generateWithClaude(
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const start = Date.now();

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model,
          max_tokens: maxTokens,
          temperature,
          system: 'You are an expert e-commerce copywriter and content creator.',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'x-api-key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      Logger.apiCall('anthropic', 'messages', Date.now() - start);

      return response.data.content[0].text.trim();
    } catch (error) {
      const err = error as Error;
      Logger.error('Claude API error', err);
      throw new Error(`Claude API error: ${err.message}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(provider: 'openai' | 'anthropic'): Promise<boolean> {
    try {
      const testPrompt = 'Say "Hello" in one word.';
      
      if (provider === 'openai') {
        await this.generateWithOpenAI(testPrompt, 'gpt-3.5-turbo', 0.7, 10);
      } else {
        await this.generateWithClaude(testPrompt, 'claude-3-sonnet-20240229', 0.7, 10);
      }
      
      return true;
    } catch (error) {
      Logger.error(`${provider} connection test failed`, error as Error);
      return false;
    }
  }
}
