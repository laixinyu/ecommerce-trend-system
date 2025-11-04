'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Award, 
  Target,
  Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ContentMetrics {
  views: number;
  likes: number;
  engagement_rate: number;
}

interface TopContent {
  id: string;
  title: string;
  platform: string;
  description: string;
  metrics: ContentMetrics;
  performance_score: number;
}

interface TagPattern {
  tag: string;
  count: number;
}

interface PlatformPattern {
  platform: string;
  avgScore: number;
}

interface ContentTypePattern {
  type: string;
  avgScore: number;
}

interface Patterns {
  commonTags: TagPattern[];
  bestPlatforms: PlatformPattern[];
  bestContentTypes: ContentTypePattern[];
  insights: string[];
}

export default function ContentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [patterns, setPatterns] = useState<Patterns | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load top performing content
      const topRes = await fetch('/api/content/analytics/top-performing?limit=10');
      if (topRes.ok) {
        const data = await topRes.json();
        setTopContent(data.content || []);
      }

      // Load success patterns
      const patternsRes = await fetch('/api/content/analytics/patterns');
      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setPatterns(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">内容分析</h1>
        <p className="text-muted-foreground">
          分析内容表现，识别成功模式
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <Tabs defaultValue="top-performing">
          <TabsList>
            <TabsTrigger value="top-performing">
              <Award className="h-4 w-4 mr-2" />
              高表现内容
            </TabsTrigger>
            <TabsTrigger value="patterns">
              <Target className="h-4 w-4 mr-2" />
              成功模式
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="h-4 w-4 mr-2" />
              洞察建议
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-performing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>表现最佳的内容</CardTitle>
                <CardDescription>
                  根据综合表现评分排序
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topContent.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    暂无数据
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topContent.map((content, index) => (
                      <div
                        key={content.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{content.title}</h4>
                            <Badge>{content.platform}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {content.description}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span>浏览: {content.metrics.views.toLocaleString()}</span>
                            <span>点赞: {content.metrics.likes.toLocaleString()}</span>
                            <span>互动率: {content.metrics.engagement_rate.toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {content.performance_score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            表现评分
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {patterns && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>最有效的标签</CardTitle>
                    <CardDescription>
                      在高表现内容中最常出现的标签
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {patterns.commonTags.map((tag) => (
                        <Badge key={tag.tag} variant="secondary" className="text-sm">
                          #{tag.tag} ({tag.count})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>最佳平台</CardTitle>
                    <CardDescription>
                      各平台的平均表现评分
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patterns.bestPlatforms.map((platform) => (
                        <div key={platform.platform} className="flex items-center justify-between">
                          <span className="capitalize font-medium">{platform.platform}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${platform.avgScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-12 text-right">
                              {Math.round(platform.avgScore)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>最佳内容类型</CardTitle>
                    <CardDescription>
                      不同内容类型的表现对比
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patterns.bestContentTypes.map((type) => (
                        <div key={type.type} className="flex items-center justify-between">
                          <span className="capitalize font-medium">{type.type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${type.avgScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-12 text-right">
                              {Math.round(type.avgScore)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>关键洞察</CardTitle>
                <CardDescription>
                  基于数据分析的建议
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patterns && patterns.insights.length > 0 ? (
                  <div className="space-y-4">
                    {patterns.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p>{insight}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    暂无洞察数据
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>优化建议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">提高发布频率</h4>
                      <p className="text-sm text-muted-foreground">
                        保持稳定的内容发布节奏可以提高用户参与度
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">使用视频内容</h4>
                      <p className="text-sm text-muted-foreground">
                        视频内容通常获得更高的互动率和分享率
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">优化发布时间</h4>
                      <p className="text-sm text-muted-foreground">
                        分析受众活跃时间，在最佳时段发布内容
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">增加互动元素</h4>
                      <p className="text-sm text-muted-foreground">
                        使用问题、投票等方式鼓励用户参与互动
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
