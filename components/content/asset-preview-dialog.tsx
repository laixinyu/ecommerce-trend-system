'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  Edit,
  Save,
  X,
  History,
  RotateCcw,
} from 'lucide-react';
import { ContentAsset, ContentAssetVersion } from '@/types/content';

interface AssetPreviewDialogProps {
  asset: ContentAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function AssetPreviewDialog({
  asset,
  open,
  onOpenChange,
  onUpdate,
}: AssetPreviewDialogProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<ContentAssetVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title);
      setDescription(asset.description);
      setTags(asset.tags || []);
      setTagInput('');
      setEditing(false);
    }
  }, [asset]);

  const loadVersions = async () => {
    if (!asset) return;
    
    try {
      setLoadingVersions(true);
      const res = await fetch(`/api/content/assets/${asset.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSave = async () => {
    if (!asset) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/content/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          tags,
        }),
      });

      if (res.ok) {
        setEditing(false);
        onUpdate();
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!asset) return;
    if (!confirm(`确定要恢复到版本 ${versionNumber} 吗？`)) return;

    try {
      const res = await fetch(`/api/content/assets/${asset.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_number: versionNumber }),
      });

      if (res.ok) {
        alert('版本已恢复');
        onUpdate();
        onOpenChange(false);
      } else {
        alert('恢复失败');
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('恢复失败');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{editing ? '编辑内容资产' : '内容资产详情'}</span>
            <div className="flex gap-2">
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {asset.platform} · {asset.type} · 版本 {asset.current_version || 1}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="details">详情</TabsTrigger>
            <TabsTrigger value="versions" onClick={loadVersions}>
              版本历史
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            {/* Preview */}
            {asset.url && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {asset.type === 'image' ? (
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="w-full h-full object-contain"
                  />
                ) : asset.type === 'video' ? (
                  <video
                    src={asset.url}
                    controls
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">无预览</p>
                  </div>
                )}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <Eye className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold">
                  {(asset.metrics?.views || 0).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">浏览量</span>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <ThumbsUp className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold">
                  {(asset.metrics?.likes || 0).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">点赞</span>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <MessageCircle className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold">
                  {(asset.metrics?.comments || 0).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">评论</span>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <Share2 className="h-5 w-5 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold">
                  {(asset.metrics?.shares || 0).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">分享</span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">互动率</span>
                <span className="text-lg font-semibold">
                  {(asset.metrics?.engagement_rate || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="edit-title">标题</Label>
              {editing ? (
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              ) : (
                <p className="mt-2">{asset.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="edit-description">描述</Label>
              {editing ? (
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="mt-2 text-muted-foreground">
                  {asset.description || '无描述'}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label>标签</Label>
              {editing ? (
                <>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="输入标签后按回车"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      添加
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {asset.tags && asset.tags.length > 0 ? (
                    asset.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">无标签</p>
                  )}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">创建时间</span>
                <span>{new Date(asset.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {asset.updated_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">更新时间</span>
                  <span>{new Date(asset.updated_at).toLocaleString('zh-CN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">文件路径</span>
                <span className="text-xs font-mono">{asset.storage_path}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            {loadingVersions ? (
              <p className="text-center text-muted-foreground py-8">加载中...</p>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">暂无历史版本</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-4 hover:bg-muted/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>版本 {version.version_number}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(version.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <p className="font-medium">{version.title}</p>
                        {version.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {version.description}
                          </p>
                        )}
                        {version.change_note && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            变更说明: {version.change_note}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.version_number)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        恢复
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
