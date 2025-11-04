'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PredictionsPage() {
  const [loading, setLoading] = useState(false);
  const [salesResult, setSalesResult] = useState<any>(null);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [inventoryResult, setInventoryResult] = useState<any>(null);
  const [trendResult, setTrendResult] = useState<any>(null);

  const handleSalesPrediction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSalesResult(null);

    const formData = new FormData(e.currentTarget);
    const productId = formData.get('product_id');
    const days = formData.get('days') || 30;

    try {
      const response = await fetch('/api/intelligence/predictions/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, days: Number(days) }),
      });

      if (response.ok) {
        const data = await response.json();
        setSalesResult(data.prediction);
      } else {
        const error = await response.json();
        alert(`预测失败: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('预测失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePricingSuggestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setPricingResult(null);

    const formData = new FormData(e.currentTarget);
    const productId = formData.get('product_id');

    try {
      const response = await fetch('/api/intelligence/predictions/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPricingResult(data.suggestion);
      } else {
        const error = await response.json();
        alert(`分析失败: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryForecast = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setInventoryResult(null);

    const formData = new FormData(e.currentTarget);
    const sku = formData.get('sku');
    const days = formData.get('days') || 30;

    try {
      const response = await fetch('/api/intelligence/predictions/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, days: Number(days) }),
      });

      if (response.ok) {
        const data = await response.json();
        setInventoryResult(data.forecast);
      } else {
        const error = await response.json();
        alert(`预测失败: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('预测失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTrendPrediction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTrendResult(null);

    const formData = new FormData(e.currentTarget);
    const category = formData.get('category');
    const days = formData.get('days') || 30;

    try {
      const response = await fetch('/api/intelligence/predictions/trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, days: Number(days) }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrendResult(data.prediction);
      } else {
        const error = await response.json();
        alert(`预测失败: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('预测失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI预测分析</h1>
        <p className="text-gray-600 mt-2">
          使用AI模型预测销量、定价、库存需求和市场趋势
        </p>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">
            <TrendingUp className="w-4 h-4 mr-2" />
            销量预测
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="w-4 h-4 mr-2" />
            智能定价
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            库存预测
          </TabsTrigger>
          <TabsTrigger value="trend">
            <BarChart3 className="w-4 h-4 mr-2" />
            趋势预测
          </TabsTrigger>
        </TabsList>

        {/* Sales Prediction */}
        <TabsContent value="sales">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">销量预测</h3>
              <form onSubmit={handleSalesPrediction} className="space-y-4">
                <div>
                  <Label htmlFor="sales-product-id">产品ID</Label>
                  <Input
                    id="sales-product-id"
                    name="product_id"
                    placeholder="输入产品ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sales-days">预测天数</Label>
                  <Input
                    id="sales-days"
                    name="days"
                    type="number"
                    defaultValue={30}
                    min={1}
                    max={90}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? '预测中...' : '开始预测'}
                </Button>
              </form>
            </Card>

            {salesResult && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">预测结果</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">置信度</div>
                    <div className="text-2xl font-bold">{salesResult.confidence}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">预测模型</div>
                    <div className="text-sm">{salesResult.model}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">未来销量预测</div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {salesResult.predictions.slice(0, 10).map((p: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{p.date}</span>
                          <span className="font-semibold">
                            {p.value.toFixed(1)} 件
                            {p.lower_bound && p.upper_bound && (
                              <span className="text-gray-500 ml-2">
                                ({p.lower_bound.toFixed(1)} - {p.upper_bound.toFixed(1)})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pricing Suggestion */}
        <TabsContent value="pricing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">智能定价建议</h3>
              <form onSubmit={handlePricingSuggestion} className="space-y-4">
                <div>
                  <Label htmlFor="pricing-product-id">产品ID</Label>
                  <Input
                    id="pricing-product-id"
                    name="product_id"
                    placeholder="输入产品ID"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? '分析中...' : '获取建议'}
                </Button>
              </form>
            </Card>

            {pricingResult && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">定价建议</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">当前价格</div>
                      <div className="text-2xl font-bold">
                        ¥{pricingResult.current_price.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">建议价格</div>
                      <div className="text-2xl font-bold text-green-600">
                        ¥{pricingResult.suggested_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">预期影响</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>销量变化</span>
                        <span className={pricingResult.expected_impact.sales_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {pricingResult.expected_impact.sales_change >= 0 ? '+' : ''}
                          {pricingResult.expected_impact.sales_change}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>收入变化</span>
                        <span className={pricingResult.expected_impact.revenue_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {pricingResult.expected_impact.revenue_change >= 0 ? '+' : ''}
                          {pricingResult.expected_impact.revenue_change}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">建议理由</div>
                    <p className="text-sm">{pricingResult.reasoning}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Inventory Forecast */}
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">库存需求预测</h3>
              <form onSubmit={handleInventoryForecast} className="space-y-4">
                <div>
                  <Label htmlFor="inventory-sku">SKU</Label>
                  <Input
                    id="inventory-sku"
                    name="sku"
                    placeholder="输入SKU"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inventory-days">预测天数</Label>
                  <Input
                    id="inventory-days"
                    name="days"
                    type="number"
                    defaultValue={30}
                    min={1}
                    max={90}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? '预测中...' : '开始预测'}
                </Button>
              </form>
            </Card>

            {inventoryResult && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">预测结果</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">当前库存</div>
                    <div className="text-2xl font-bold">{inventoryResult.current_stock} 件</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">补货建议</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>建议日期</span>
                        <span className="font-semibold">
                          {inventoryResult.reorder_recommendation.date}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>建议数量</span>
                        <span className="font-semibold">
                          {inventoryResult.reorder_recommendation.quantity} 件
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>紧急程度</span>
                        <span className={`font-semibold ${
                          inventoryResult.reorder_recommendation.urgency === 'high' ? 'text-red-600' :
                          inventoryResult.reorder_recommendation.urgency === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {inventoryResult.reorder_recommendation.urgency === 'high' ? '高' :
                           inventoryResult.reorder_recommendation.urgency === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Trend Prediction */}
        <TabsContent value="trend">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">市场趋势预测</h3>
              <form onSubmit={handleTrendPrediction} className="space-y-4">
                <div>
                  <Label htmlFor="trend-category">品类</Label>
                  <Input
                    id="trend-category"
                    name="category"
                    placeholder="输入品类名称"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="trend-days">预测天数</Label>
                  <Input
                    id="trend-days"
                    name="days"
                    type="number"
                    defaultValue={30}
                    min={1}
                    max={90}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? '预测中...' : '开始预测'}
                </Button>
              </form>
            </Card>

            {trendResult && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">预测结果</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">置信度</div>
                    <div className="text-2xl font-bold">{trendResult.confidence}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">趋势预测</div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {trendResult.predictions.slice(0, 10).map((p: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{p.date}</span>
                          <span className="font-semibold">
                            {p.value.toFixed(1)} 分
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
