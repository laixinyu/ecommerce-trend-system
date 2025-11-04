'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Upload,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContentAsset } from '@/types/content';
import { UploadAssetDialog } from '@/components/content/upload-asset-dialog';
import { AssetPreviewDialog } from '@/components/content/asset-preview-dialog';

export default function ContentAssetsPage() {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<ContentAsset | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformFilter, typeFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const res = await fetch(`/api/content/assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAssets();
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ q: searchQuery });
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const res = await fetch(`/api/content/assets/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个内容资产吗？')) return;

    try {
      const res = await fetch(`/api/content/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAssets(assets.filter(a => a.id !== assetId));
        alert('内容资产已删除');
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败');
    }
  };

  const handleAssetClick = (asset: ContentAsset) => {
    setPreviewAsset(asset);
    setPreviewDialogOpen(true);
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      meta: 'bg-blue-500',
      instagram: 'bg-pink-500',
      tiktok: 'bg-black',
      youtube: 'bg-red-500',
    };
    return colors[platform] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">内容资产库</h1>
          <p className="text-muted-foreground">
            管理所有社交媒体内容资产
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          上传内容
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索标题、描述或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有平台</SelectItem>
                <SelectItem value="meta">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="内容类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="image">图片</SelectItem>
                <SelectItem value="video">视频</SelectItem>
                <SelectItem value="text">文本</SelectItem>
                <SelectItem value="mixed">混合</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              没有找到内容资产。请先同步社交媒体数据或上传内容。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card 
              key={asset.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAssetClick(asset)}
            >
              {/* Thumbnail */}
              {asset.url && (
                <div className="aspect-video bg-muted relative">
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPlatformColor(asset.platform)}>
                        {asset.platform}
                      </Badge>
                      <Badge variant="secondary">{asset.type}</Badge>
                      {asset.current_version && asset.current_version > 1 && (
                        <Badge variant="outline">v{asset.current_version}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {asset.title}
                    </CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => handleDelete(asset.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">
                  {asset.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {asset.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {asset.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{asset.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="flex flex-col items-center">
                    <Eye className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="font-semibold">
                      {(asset.metrics?.views || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ThumbsUp className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="font-semibold">
                      {(asset.metrics?.likes || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="font-semibold">
                      {(asset.metrics?.comments || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Share2 className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="font-semibold">
                      {(asset.metrics?.shares || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Engagement Rate */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">互动率</span>
                    <span className="font-semibold">
                      {(asset.metrics?.engagement_rate || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <UploadAssetDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={loadAssets}
      />

      {/* Preview Dialog */}
      <AssetPreviewDialog
        asset={previewAsset}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onUpdate={loadAssets}
      />
    </div>
  );
}
