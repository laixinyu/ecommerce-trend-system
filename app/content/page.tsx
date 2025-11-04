'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  Sparkles, 
  Image as ImageIcon,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function ContentPage() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalViews: 0,
    avgEngagement: 0,
    topPlatform: 'N/A',
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load analytics
      const analyticsRes = await fetch('/api/content/analytics');
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        
        // Find top platform
        let topPlatform = 'N/A';
        let maxViews = 0;
        Object.entries(data.byPlatform || {}).forEach(([platform, stats]) => {
          const platformStats = stats as { views: number };
          if (platformStats.views > maxViews) {
            maxViews = platformStats.views;
            topPlatform = platform;
          }
        });

        setStats({
          totalAssets: Object.values(data.byPlatform || {}).reduce(
            (sum: number, p) => sum + (p as { postCount: number }).postCount, 0
          ),
          totalViews: data.totalViews || 0,
          avgEngagement: data.avgEngagementRate || 0,
          topPlatform,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/content/sync', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert(`Successfully synced ${data.synced} content items`);
        loadStats();
      } else {
        alert(`Sync completed with errors: ${data.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync content');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">内容运营</h1>
          <p className="text-muted-foreground">
            管理和分析社交媒体内容，使用AI生成营销文案
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            同步数据
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内容资产</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalAssets.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              总内容数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              所有平台累计
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均互动率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${stats.avgEngagement.toFixed(2)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              点赞、评论、分享
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最佳平台</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {loading ? '...' : stats.topPlatform}
            </div>
            <p className="text-xs text-muted-foreground">
              表现最好的平台
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/content/assets">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <ImageIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>内容资产库</CardTitle>
              <CardDescription>
                浏览和管理所有内容资产
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/content/ai-generator">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <Sparkles className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>AI内容生成</CardTitle>
              <CardDescription>
                使用AI生成产品描述和广告文案
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/content/analytics">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>内容分析</CardTitle>
              <CardDescription>
                查看内容表现和成功模式
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/content/social-media">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <TrendingUp className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>社媒数据</CardTitle>
              <CardDescription>
                查看各平台社交媒体数据
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>快速开始</CardTitle>
          <CardDescription>
            开始使用内容运营模块
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">1. 连接社交媒体账号</h4>
              <p className="text-sm text-muted-foreground">
                在集成管理中连接Meta、TikTok等平台账号
              </p>
              <Link href="/dashboard">
                <Button variant="ghost" className="px-0">
                  前往集成管理 →
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">2. 同步内容数据</h4>
              <p className="text-sm text-muted-foreground">
                点击&ldquo;同步数据&rdquo;按钮从社交媒体平台导入内容
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">3. 使用AI生成内容</h4>
              <p className="text-sm text-muted-foreground">
                利用AI工具生成产品描述、广告文案和社交媒体帖子
              </p>
              <Link href="/content/ai-generator">
                <Button variant="ghost" className="px-0">
                  开始生成 →
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">4. 分析内容表现</h4>
              <p className="text-sm text-muted-foreground">
                查看内容分析报告，识别高表现内容的特征
              </p>
              <Link href="/content/analytics">
                <Button variant="ghost" className="px-0">
                  查看分析 →
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
