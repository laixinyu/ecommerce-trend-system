'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';

interface PlatformStats {
  postCount: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avgEngagementRate: number;
}

interface Analytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  byPlatform: Record<string, PlatformStats>;
}

export default function SocialMediaPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/content/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const iconClass = "h-5 w-5";
    switch (platform) {
      case 'meta':
      case 'facebook':
        return <TrendingUp className={iconClass} />;
      case 'instagram':
        return <Heart className={iconClass} />;
      case 'tiktok':
        return <Share2 className={iconClass} />;
      default:
        return <TrendingUp className={iconClass} />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">社交媒体数据</h1>
        <p className="text-muted-foreground">
          查看各平台的社交媒体表现数据
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : !analytics || Object.keys(analytics.byPlatform || {}).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              暂无社交媒体数据。请先连接社交媒体账号并同步数据。
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalViews.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总点赞</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalLikes.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总评论</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalComments.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总分享</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalShares.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>各平台表现</CardTitle>
              <CardDescription>
                不同社交媒体平台的详细数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(analytics.byPlatform).map(([platform, stats]) => (
                  <div key={platform} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      {getPlatformIcon(platform)}
                      <h3 className="text-lg font-semibold capitalize">{platform}</h3>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {stats.postCount} 条内容
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">浏览量</div>
                        <div className="text-xl font-bold">{stats.views.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">点赞</div>
                        <div className="text-xl font-bold">{stats.likes.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">评论</div>
                        <div className="text-xl font-bold">{stats.comments.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">分享</div>
                        <div className="text-xl font-bold">{stats.shares.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">平均互动率</div>
                        <div className="text-xl font-bold">
                          {stats.avgEngagementRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Rate Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>互动率对比</CardTitle>
              <CardDescription>
                各平台的平均互动率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.byPlatform)
                  .sort(([, a], [, b]) => 
                    b.avgEngagementRate - a.avgEngagementRate
                  )
                  .map(([platform, stats]) => (
                    <div key={platform} className="flex items-center gap-4">
                      <div className="w-24 capitalize font-medium">{platform}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary flex items-center justify-end pr-2 text-xs text-white font-semibold transition-all"
                            style={{ 
                              width: `${Math.min(stats.avgEngagementRate * 10, 100)}%` 
                            }}
                          >
                            {stats.avgEngagementRate > 1 && `${stats.avgEngagementRate.toFixed(2)}%`}
                          </div>
                        </div>
                      </div>
                      <div className="w-16 text-right font-semibold">
                        {stats.avgEngagementRate.toFixed(2)}%
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
