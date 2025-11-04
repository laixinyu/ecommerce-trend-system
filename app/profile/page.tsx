'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Heart, Filter, BookOpen, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';

type Tab = 'info' | 'notifications' | 'favorites' | 'filters' | 'tutorial' | 'settings';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('hasSeenTutorial');
    }
    return false;
  });

  // 用户信息 - 跟踪是否已编辑，未编辑时使用 user 数据
  const [isUserInfoEdited, setIsUserInfoEdited] = useState(false);
  const [editedUserInfo, setEditedUserInfo] = useState({
    name: '',
    email: '',
    company: '',
  });

  // 实际显示的用户信息：如果已编辑则使用编辑后的，否则使用 user 数据
  const userInfo = isUserInfoEdited
    ? editedUserInfo
    : {
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
      company: user?.user_metadata?.company || '',
    };

  // 通知偏好
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    pushEnabled: false,
    watchedCategories: [] as string[],
    watchedKeywords: [] as string[],
    trendThreshold: 70,
  });

  // 收藏商品
  interface Favorite {
    id: string;
    product_id: string;
    products: {
      id: string;
      name: string;
      current_price: number;
      platform: string;
      image_url?: string;
    };
    created_at: string;
  }
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // 筛选组合
  const [savedFilters, setSavedFilters] = useState<Array<{ id: string; name: string }>>([]);

  // 加载用户数据 - 仅在 user 存在时执行一次
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        // 加载通知偏好
        const prefsRes = await fetch('/api/user/notifications');
        const prefsData = await prefsRes.json();
        if (prefsData.preferences) {
          setNotificationPrefs({
            emailEnabled: prefsData.preferences.email_enabled,
            pushEnabled: prefsData.preferences.push_enabled,
            watchedCategories: prefsData.preferences.watched_categories || [],
            watchedKeywords: prefsData.preferences.watched_keywords || [],
            trendThreshold: prefsData.preferences.trend_threshold || 70,
          });
        }

        // 加载收藏
        setFavoritesLoading(true);
        const favRes = await fetch('/api/user/favorites');
        const favData = await favRes.json();
        setFavorites(favData.favorites || []);
        setFavoritesLoading(false);

        // 加载筛选组合
        const filtersRes = await fetch('/api/user/filters');
        const filtersData = await filtersRes.json();
        setSavedFilters(filtersData.filters || []);
      } catch (error) {
        console.error('加载用户数据失败:', error);
      }
    };

    loadUserData();
  }, [user]);

  const handleSaveUserInfo = async () => {
    // 实际实现中应该调用API更新用户信息
    alert('用户信息已保存');
  };

  const handleSaveNotificationPrefs = async () => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_enabled: notificationPrefs.emailEnabled,
          push_enabled: notificationPrefs.pushEnabled,
          watched_categories: notificationPrefs.watchedCategories,
          watched_keywords: notificationPrefs.watchedKeywords,
          trend_threshold: notificationPrefs.trendThreshold,
        }),
      });
      alert('通知偏好已保存');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await fetch(`/api/user/favorites?product_id=${productId}`, {
        method: 'DELETE',
      });
      setFavorites(favorites.filter((f) => f.product_id !== productId));
    } catch (error) {
      console.error('删除收藏失败:', error);
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    try {
      await fetch(`/api/user/filters?id=${filterId}`, {
        method: 'DELETE',
      });
      setSavedFilters(savedFilters.filter((f) => f.id !== filterId));
    } catch (error) {
      console.error('删除筛选组合失败:', error);
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const tabs = [
    { id: 'info' as Tab, label: '个人信息', icon: User },
    { id: 'notifications' as Tab, label: '通知设置', icon: Bell },
    { id: 'favorites' as Tab, label: '我的收藏', icon: Heart },
    { id: 'filters' as Tab, label: '筛选组合', icon: Filter },
    { id: 'tutorial' as Tab, label: '使用教程', icon: BookOpen },
    { id: 'settings' as Tab, label: '账户设置', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">个人中心</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {/* 个人信息 */}
            {activeTab === 'info' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">个人信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名
                    </label>
                    <input
                      type="text"
                      value={userInfo.name}
                      onChange={(e) => {
                        setIsUserInfoEdited(true);
                        setEditedUserInfo({ ...userInfo, name: e.target.value });
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={userInfo.email}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      公司
                    </label>
                    <input
                      type="text"
                      value={userInfo.company}
                      onChange={(e) => {
                        setIsUserInfoEdited(true);
                        setEditedUserInfo({ ...userInfo, company: e.target.value });
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <Button onClick={handleSaveUserInfo}>保存</Button>
                </div>
              </Card>
            )}

            {/* 通知设置 */}
            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">通知设置</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">通知方式</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationPrefs.emailEnabled}
                          onChange={(e) =>
                            setNotificationPrefs({
                              ...notificationPrefs,
                              emailEnabled: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span>邮件通知</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationPrefs.pushEnabled}
                          onChange={(e) =>
                            setNotificationPrefs({
                              ...notificationPrefs,
                              pushEnabled: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span>站内消息</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">关注类目</h3>
                    <div className="flex flex-wrap gap-2">
                      {['电子产品', '服装配饰', '家居用品', '美妆护肤', '运动户外'].map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            const categories = notificationPrefs.watchedCategories;
                            if (categories.includes(category)) {
                              setNotificationPrefs({
                                ...notificationPrefs,
                                watchedCategories: categories.filter((c) => c !== category),
                              });
                            } else {
                              setNotificationPrefs({
                                ...notificationPrefs,
                                watchedCategories: [...categories, category],
                              });
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm ${notificationPrefs.watchedCategories.includes(category)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">趋势分数阈值</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      当商品趋势分数超过此值时通知我
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={notificationPrefs.trendThreshold}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          trendThreshold: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <div className="text-center text-lg font-medium text-blue-600">
                      {notificationPrefs.trendThreshold}
                    </div>
                  </div>

                  <Button onClick={handleSaveNotificationPrefs}>保存设置</Button>
                </div>
              </Card>
            )}

            {/* 我的收藏 */}
            {activeTab === 'favorites' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">我的收藏 ({favorites.length})</h2>
                  {favoritesLoading && <span className="text-sm text-gray-500">加载中...</span>}
                </div>
                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        {/* 商品图片 */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {favorite.products?.image_url ? (
                            <img
                              src={favorite.products.image_url}
                              alt={favorite.products.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              📦
                            </div>
                          )}
                        </div>

                        {/* 商品信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">
                            {favorite.products?.name || '未知商品'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {favorite.products?.platform || 'unknown'}
                            </span>
                            <span className="font-semibold text-blue-600">
                              ${favorite.products?.current_price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.location.href = `/products/${favorite.product_id}`}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              查看详情
                            </button>
                            <button
                              onClick={() => handleRemoveFavorite(favorite.product_id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              取消收藏
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💔</div>
                    <p className="text-gray-500 mb-4">暂无收藏商品</p>
                    <Button onClick={() => window.location.href = '/products'}>
                      去浏览商品
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* 筛选组合 */}
            {activeTab === 'filters' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">筛选组合 ({savedFilters.length})</h2>
                {savedFilters.length > 0 ? (
                  <div className="space-y-3">
                    {savedFilters.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{filter.name}</h3>
                          <p className="text-sm text-gray-600">
                            创建于 {new Date(filter.created_at).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded">
                            应用
                          </button>
                          <button
                            onClick={() => handleDeleteFilter(filter.id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">暂无保存的筛选组合</p>
                )}
              </Card>
            )}

            {/* 使用教程 */}
            {activeTab === 'tutorial' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">使用教程</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-medium mb-2">1. 浏览趋势商品</h3>
                    <p className="text-sm text-gray-600">
                      在商品浏览页面，您可以使用筛选器按类目、平台、价格等条件筛选商品，并按趋势分数、竞争度等排序。
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-medium mb-2">2. 搜索关键词</h3>
                    <p className="text-sm text-gray-600">
                      使用搜索功能查找特定关键词的商品，查看趋势图表和相关推荐。
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-medium mb-2">3. 对比分析</h3>
                    <p className="text-sm text-gray-600">
                      在对比页面选择多个商品进行趋势对比，查看同比环比数据和季节性特征。
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-medium mb-2">4. 生成报告</h3>
                    <p className="text-sm text-gray-600">
                      在报告中心生成专业的趋势分析报告，支持PDF和Excel格式导出。
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* 账户设置 */}
            {activeTab === 'settings' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">账户设置</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">修改密码</h3>
                    <Button>修改密码</Button>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2 text-red-600">危险操作</h3>
                    <Button className="bg-red-600 hover:bg-red-700">删除账户</Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* 使用引导教程弹窗 */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl mx-4 p-6">
              <h2 className="text-2xl font-bold mb-4">欢迎使用电商趋势分析系统！</h2>
              <div className="space-y-3 mb-6">
                <p>🎯 发现热门商品趋势</p>
                <p>📊 分析市场竞争态势</p>
                <p>🔍 搜索关键词热度</p>
                <p>📈 生成专业分析报告</p>
              </div>
              <Button onClick={closeTutorial} className="w-full">
                开始使用
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
