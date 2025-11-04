'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  type: 'article' | 'video' | 'guide';
}

const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: '如何开始使用营销数字化模块',
    description: '了解如何连接广告账户并开始分析营销数据',
    category: '营销',
    url: '/docs/marketing-getting-started',
    type: 'guide',
  },
  {
    id: '2',
    title: 'RFM客户分层分析指南',
    description: '学习如何使用RFM模型对客户进行价值分层',
    category: '用户增长',
    url: '/docs/rfm-analysis',
    type: 'article',
  },
  {
    id: '3',
    title: 'AI内容生成功能演示',
    description: '观看视频了解如何使用AI生成营销文案',
    category: '内容运营',
    url: '/docs/ai-content-video',
    type: 'video',
  },
  {
    id: '4',
    title: '库存管理和预警设置',
    description: '配置库存预警规则，避免缺货和积压',
    category: '供应链',
    url: '/docs/inventory-management',
    type: 'guide',
  },
  {
    id: '5',
    title: '创建自定义仪表板',
    description: '学习如何创建和配置个性化数据仪表板',
    category: '智能决策',
    url: '/docs/custom-dashboards',
    type: 'article',
  },
];

interface HelpPanelProps {
  context?: string; // Current page context for contextual help
  className?: string;
}

export function HelpPanel({ context, className }: HelpPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(helpArticles.map((a) => a.category)));

  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'guide':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <CardTitle>帮助中心</CardTitle>
        </div>
        <CardDescription>查找文档、教程和常见问题解答</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索帮助文章..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            全部
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-2">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              未找到相关帮助文章
            </div>
          ) : (
            filteredArticles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    {getTypeIcon(article.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      {article.type === 'video' && (
                        <Badge variant="outline" className="text-xs">
                          视频
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            联系支持团队
          </Button>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            查看完整文档
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
