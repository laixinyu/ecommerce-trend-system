'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';

export default function AIGeneratorPage() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | string[] | { caption?: string; hashtags?: string[]; subject?: string; body?: string } | null>(null);

  // Product Description State
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  // Ad Copy State
  const [adPlatform, setAdPlatform] = useState('facebook');
  const [adVariations, setAdVariations] = useState('3');

  // Social Post State
  const [socialPlatform, setSocialPlatform] = useState('instagram');
  const [tone, setTone] = useState('casual');

  // Email State
  const [emailType, setEmailType] = useState('promotional');

  // Model Selection
  const [model, setModel] = useState('gpt-3.5-turbo');

  const generateContent = async (type: string, options: Record<string, unknown> = {}) => {
    if (!productName || !category || !price) {
      alert('请填写产品名称、类别和价格');
      return;
    }

    try {
      setGenerating(true);
      setResult(null);

      const product = {
        name: productName,
        category,
        price: parseFloat(price),
        features: features.split('\n').filter(f => f.trim()),
        targetAudience: targetAudience || undefined,
      };

      const res = await fetch('/api/content/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          product,
          options: { ...options, model },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.content);
      } else {
        const error = await res.json();
        alert(`生成失败: ${error.error}`);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI内容生成</h1>
        <p className="text-muted-foreground">
          使用AI生成产品描述、广告文案和社交媒体内容
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>产品信息</CardTitle>
              <CardDescription>
                填写产品基本信息用于生成内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productName">产品名称 *</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="例如: 无线蓝牙耳机"
                />
              </div>

              <div>
                <Label htmlFor="category">类别 *</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="例如: 电子产品"
                />
              </div>

              <div>
                <Label htmlFor="price">价格 (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="例如: 49.99"
                />
              </div>

              <div>
                <Label htmlFor="features">主要特点 (每行一个)</Label>
                <Textarea
                  id="features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="例如:&#10;降噪功能&#10;30小时续航&#10;快速充电"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">目标受众 (可选)</Label>
                <Input
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="例如: 年轻专业人士"
                />
              </div>

              <div>
                <Label htmlFor="model">AI模型</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (快速)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4 (高质量)</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Generation Options */}
          <Card>
            <CardHeader>
              <CardTitle>生成选项</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="description">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="description">描述</TabsTrigger>
                  <TabsTrigger value="ad">广告</TabsTrigger>
                  <TabsTrigger value="social">社媒</TabsTrigger>
                  <TabsTrigger value="email">邮件</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    生成专业的产品描述，适用于电商平台
                  </p>
                  <Button
                    onClick={() => generateContent('product_description')}
                    disabled={generating}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? '生成中...' : '生成产品描述'}
                  </Button>
                </TabsContent>

                <TabsContent value="ad" className="space-y-4">
                  <div>
                    <Label>广告平台</Label>
                    <Select value={adPlatform} onValueChange={setAdPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="google">Google Ads</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>变体数量</Label>
                    <Select value={adVariations} onValueChange={setAdVariations}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2个变体</SelectItem>
                        <SelectItem value="3">3个变体</SelectItem>
                        <SelectItem value="5">5个变体</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() =>
                      generateContent('ad_copy', {
                        platform: adPlatform,
                        variations: parseInt(adVariations),
                      })
                    }
                    disabled={generating}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? '生成中...' : '生成广告文案'}
                  </Button>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div>
                    <Label>社交平台</Label>
                    <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>语气风格</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">专业</SelectItem>
                        <SelectItem value="casual">轻松</SelectItem>
                        <SelectItem value="humorous">幽默</SelectItem>
                        <SelectItem value="inspirational">励志</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() =>
                      generateContent('social_post', {
                        platform: socialPlatform,
                        tone,
                      })
                    }
                    disabled={generating}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? '生成中...' : '生成社媒帖子'}
                  </Button>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <div>
                    <Label>邮件类型</Label>
                    <Select value={emailType} onValueChange={setEmailType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">促销邮件</SelectItem>
                        <SelectItem value="abandoned_cart">弃购挽回</SelectItem>
                        <SelectItem value="product_launch">新品发布</SelectItem>
                        <SelectItem value="newsletter">新闻通讯</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() =>
                      generateContent('email', { emailType })
                    }
                    disabled={generating}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? '生成中...' : '生成邮件内容'}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Result Section */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>生成结果</CardTitle>
                {result && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                      )}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">AI正在生成内容...</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {typeof result === 'string' ? (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                        {result}
                      </pre>
                    </div>
                  ) : Array.isArray(result) ? (
                    <div className="space-y-4">
                      {result.map((item, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-base">变体 {index + 1}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-wrap">{item}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.subject && (
                        <div>
                          <Label>主题</Label>
                          <p className="mt-1 p-3 bg-muted rounded-lg">{result.subject}</p>
                        </div>
                      )}
                      {result.caption && (
                        <div>
                          <Label>文案</Label>
                          <p className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                            {result.caption}
                          </p>
                        </div>
                      )}
                      {result.body && (
                        <div>
                          <Label>正文</Label>
                          <p className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                            {result.body}
                          </p>
                        </div>
                      )}
                      {result.hashtags && result.hashtags.length > 0 && (
                        <div>
                          <Label>推荐标签</Label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {result.hashtags.map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    填写产品信息并选择生成类型开始
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
