# AI Content Generation Feature

## Overview

The AI Content Generation feature enables users to automatically generate high-quality marketing content using OpenAI and Claude AI models. This feature supports multiple content types including product descriptions, ad copy, social media posts, and email campaigns.

## Features

### 1. Product Description Generation
- Generates compelling 150-200 word product descriptions
- Highlights unique selling points and benefits
- SEO-friendly with relevant keywords
- Professional and engaging tone

### 2. Ad Copy Generation (Multi-Variant)
- Supports multiple platforms: Facebook, Google Ads, TikTok, Instagram
- Generates 2-5 variations for A/B testing
- Platform-specific optimization
- Different angles: feature-focused, benefit-focused, urgency-driven
- Includes clear call-to-action

### 3. Social Media Post Generation
- Supports platforms: Facebook, Instagram, TikTok, Twitter/X
- Multiple tone options: professional, casual, humorous, inspirational
- Generates caption and hashtag suggestions
- Platform-optimized content

### 4. Email Content Generation
- Email types: promotional, abandoned cart, product launch, newsletter
- Generates subject line and body
- Mobile-friendly formatting
- Clear call-to-action

### 5. Content Improvement
- Enhances existing content for clarity, engagement, and SEO
- Maintains core message while improving quality

## Supported AI Models

### OpenAI Models
- **GPT-3.5 Turbo**: Fast and cost-effective for most use cases
- **GPT-4**: Higher quality output for premium content

### Anthropic Models
- **Claude 3 Sonnet**: Balanced performance and quality
- **Claude 3 Opus**: Highest quality for critical content

## API Integration

### OpenAI Integration
- Uses OpenAI Chat Completions API
- Supports GPT-3.5 and GPT-4 models
- Configurable temperature and max tokens
- Automatic retry on failures

### Claude Integration
- Uses Anthropic Messages API
- Supports Claude 3 Sonnet and Opus models
- Configurable temperature and max tokens
- Automatic retry on failures

## Database Schema

### ai_generated_content Table
```sql
CREATE TABLE ai_generated_content (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(50) CHECK (type IN ('product_description', 'ad_copy', 'social_post', 'email', 'improve')),
  prompt JSONB NOT NULL,
  content TEXT NOT NULL,
  model VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### POST /api/content/ai/generate
Generate AI content based on product information and options.

**Request Body:**
```json
{
  "type": "product_description" | "ad_copy" | "social_post" | "email" | "improve",
  "product": {
    "name": "string",
    "category": "string",
    "price": number,
    "features": ["string"],
    "targetAudience": "string" (optional)
  },
  "options": {
    "model": "gpt-3.5-turbo" | "gpt-4" | "claude-3-sonnet-20240229" | "claude-3-opus-20240229",
    "temperature": number (0-1),
    "maxTokens": number,
    // Type-specific options
    "platform": "facebook" | "google" | "tiktok" | "instagram" (for ad_copy, social_post),
    "variations": number (for ad_copy),
    "tone": "professional" | "casual" | "humorous" | "inspirational" (for social_post),
    "emailType": "promotional" | "abandoned_cart" | "product_launch" | "newsletter" (for email)
  }
}
```

**Response:**
```json
{
  "success": true,
  "content": "string" | ["string"] | { "caption": "string", "hashtags": ["string"] } | { "subject": "string", "body": "string" },
  "type": "string"
}
```

### GET /api/content/ai/history
Retrieve generation history for the authenticated user.

**Query Parameters:**
- `type`: Filter by content type (optional)
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "string",
      "prompt": {},
      "content": "string",
      "model": "string",
      "created_at": "timestamp"
    }
  ],
  "total": number,
  "limit": number,
  "offset": number
}
```

## UI Components

### AI Generator Page (`/content/ai-generator`)
- Product information form
- Model selection dropdown
- Content type tabs (Description, Ad, Social, Email)
- Platform and option selectors
- Real-time generation with loading states
- Result display with copy functionality
- Generation history

## Environment Variables

Required environment variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...
```

## Usage Example

### Generate Product Description
```typescript
const response = await fetch('/api/content/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'product_description',
    product: {
      name: 'Wireless Bluetooth Earbuds',
      category: 'Electronics',
      price: 49.99,
      features: ['Noise cancellation', '30-hour battery', 'Fast charging'],
      targetAudience: 'Young professionals'
    },
    options: {
      model: 'gpt-4'
    }
  })
});

const data = await response.json();
console.log(data.content); // Generated description
```

### Generate Ad Copy Variations
```typescript
const response = await fetch('/api/content/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'ad_copy',
    product: {
      name: 'Wireless Bluetooth Earbuds',
      category: 'Electronics',
      price: 49.99,
      features: ['Noise cancellation', '30-hour battery']
    },
    options: {
      model: 'gpt-3.5-turbo',
      platform: 'facebook',
      variations: 3
    }
  })
});

const data = await response.json();
console.log(data.content); // Array of 3 ad copy variations
```

## Error Handling

The system handles various error scenarios:

1. **Missing API Keys**: Returns 500 error with message "API key not configured"
2. **Invalid Input**: Returns 400 error with validation message
3. **API Failures**: Automatic retry with exponential backoff
4. **Rate Limiting**: Queues requests and notifies user of delays

## Performance Considerations

- **Caching**: Generated content is stored in database for history
- **Rate Limiting**: Implements rate limiting to prevent API abuse
- **Async Processing**: All generation happens asynchronously
- **Model Selection**: Users can choose faster models for quick iterations

## Security

- **Authentication**: All endpoints require authenticated user
- **Row Level Security**: Users can only access their own generated content
- **API Key Protection**: Keys stored as environment variables, never exposed to client
- **Input Validation**: All inputs validated before processing

## Future Enhancements

1. **Batch Generation**: Generate multiple pieces of content at once
2. **Templates**: Save and reuse successful prompts
3. **Content Scheduling**: Schedule generated content for publishing
4. **Analytics**: Track performance of AI-generated content
5. **Fine-tuning**: Custom model training on user's best-performing content
6. **Multi-language Support**: Generate content in multiple languages
7. **Brand Voice**: Train models on brand-specific tone and style

## Troubleshooting

### API Key Issues
- Verify environment variables are set correctly
- Check API key validity with provider
- Ensure sufficient API credits

### Generation Failures
- Check network connectivity
- Verify input data format
- Review API rate limits
- Check error logs for specific issues

### Quality Issues
- Try different models (GPT-4 for higher quality)
- Adjust temperature (lower for more focused, higher for creative)
- Provide more detailed product information
- Add target audience information

## Related Documentation

- [Content Module Overview](./TASK_3_IMPLEMENTATION_SUMMARY.md)
- [Integration System](./INTEGRATION_SYSTEM.md)
- [API Documentation](./API.md)
