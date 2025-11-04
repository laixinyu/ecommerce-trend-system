# AI Content Generation - Quick Start Guide

## Setup

### 1. Install Dependencies
```bash
cd ecommerce-trend-system
npm install
```

### 2. Configure API Keys
Add to your `.env.local` file:
```bash
# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...

# Anthropic API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run Database Migration
```bash
npm run migration:008
```

### 4. Start Development Server
```bash
npm run dev
```

## Using the AI Generator

### Access the Feature
Navigate to: `http://localhost:3000/content/ai-generator`

### Generate Content

#### Step 1: Fill Product Information
- **Product Name**: e.g., "Wireless Bluetooth Earbuds"
- **Category**: e.g., "Electronics"
- **Price**: e.g., "49.99"
- **Features** (one per line):
  ```
  Noise cancellation
  30-hour battery life
  Fast charging
  IPX7 waterproof
  ```
- **Target Audience** (optional): e.g., "Young professionals"

#### Step 2: Select AI Model
- **GPT-3.5 Turbo**: Fast and cost-effective (recommended for testing)
- **GPT-4**: Higher quality, slower, more expensive
- **Claude 3 Sonnet**: Balanced performance
- **Claude 3 Opus**: Highest quality

#### Step 3: Choose Content Type

##### Product Description
- Click "描述" tab
- Click "生成产品描述"
- Get a 150-200 word SEO-optimized description

##### Ad Copy
- Click "广告" tab
- Select platform: Facebook, Google Ads, TikTok, or Instagram
- Choose number of variations: 2, 3, or 5
- Click "生成广告文案"
- Get multiple variations for A/B testing

##### Social Media Post
- Click "社媒" tab
- Select platform: Facebook, Instagram, TikTok, or Twitter
- Choose tone: Professional, Casual, Humorous, or Inspirational
- Click "生成社媒帖子"
- Get caption and hashtag suggestions

##### Email Content
- Click "邮件" tab
- Select type: Promotional, Abandoned Cart, Product Launch, or Newsletter
- Click "生成邮件内容"
- Get subject line and email body

#### Step 4: Use Generated Content
- Review the generated content
- Click "复制" to copy to clipboard
- Use in your marketing campaigns

## API Usage

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
      features: ['Noise cancellation', '30-hour battery'],
      targetAudience: 'Young professionals'
    },
    options: {
      model: 'gpt-3.5-turbo'
    }
  })
});

const data = await response.json();
console.log(data.content);
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
console.log(data.content); // Array of 3 variations
```

### Get Generation History
```typescript
const response = await fetch('/api/content/ai/history?limit=10&type=product_description');
const data = await response.json();
console.log(data.history);
```

## Tips for Best Results

### Product Information
- **Be Specific**: Include detailed features and benefits
- **Target Audience**: Specify who the product is for
- **Unique Selling Points**: Highlight what makes it special

### Model Selection
- **GPT-3.5 Turbo**: Best for quick iterations and testing
- **GPT-4**: Use for final, high-quality content
- **Claude 3 Sonnet**: Good balance of speed and quality
- **Claude 3 Opus**: Use for critical, high-stakes content

### Platform Optimization
- **Facebook**: Conversational, engaging, 125 characters
- **Google Ads**: Concise, keyword-rich, 30/90 characters
- **TikTok**: Trendy, catchy, youth-oriented
- **Instagram**: Visual-focused, hashtag-friendly

### Tone Selection
- **Professional**: B2B products, enterprise solutions
- **Casual**: Consumer products, everyday items
- **Humorous**: Fun products, entertainment
- **Inspirational**: Lifestyle products, aspirational items

## Troubleshooting

### "API key not configured"
- Check that environment variables are set in `.env.local`
- Restart the development server after adding keys

### "Generation failed"
- Check your API key is valid
- Verify you have sufficient API credits
- Check network connectivity
- Review error message in browser console

### Poor Quality Results
- Add more detailed product information
- Specify target audience
- Try a different AI model (GPT-4 for better quality)
- Adjust the prompt by providing more context

### Rate Limit Errors
- Wait a few minutes before trying again
- Consider upgrading your API plan
- Use GPT-3.5 instead of GPT-4 (higher rate limits)

## Cost Considerations

### OpenAI Pricing (approximate)
- **GPT-3.5 Turbo**: $0.0015 per 1K tokens (~$0.001 per generation)
- **GPT-4**: $0.03 per 1K tokens (~$0.02 per generation)

### Anthropic Pricing (approximate)
- **Claude 3 Sonnet**: $0.003 per 1K tokens (~$0.002 per generation)
- **Claude 3 Opus**: $0.015 per 1K tokens (~$0.01 per generation)

### Cost Optimization
- Use GPT-3.5 for testing and iterations
- Use GPT-4/Opus only for final content
- Generate multiple variations at once
- Review and refine prompts to reduce regenerations

## Best Practices

1. **Start Simple**: Begin with basic product info, add details as needed
2. **Iterate**: Generate multiple versions and pick the best
3. **Customize**: Edit generated content to match your brand voice
4. **Test**: A/B test different variations to find what works
5. **Save**: Keep track of successful prompts and patterns
6. **Review**: Always review AI-generated content before publishing

## Next Steps

- Explore different content types and platforms
- Experiment with different AI models
- Test generated content in your campaigns
- Track performance and iterate
- Provide feedback for improvements

## Support

For issues or questions:
- Check the [full documentation](./AI_CONTENT_GENERATION.md)
- Review [troubleshooting guide](./AI_CONTENT_GENERATION.md#troubleshooting)
- Contact support team

## Related Features

- [Content Assets Management](./TASK_3_IMPLEMENTATION_SUMMARY.md)
- [Content Analytics](./TASK_3_IMPLEMENTATION_SUMMARY.md)
- [Social Media Integration](./TASK_3_IMPLEMENTATION_SUMMARY.md)
