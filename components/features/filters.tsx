'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Platform } from '@/types';

// 搜索输入框组件
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, onSearch, placeholder = '搜索...' }: SearchInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <Button onClick={onSearch}>搜索</Button>
    </div>
  );
}

// 平台筛选器组件
export interface PlatformFilterProps {
  selected: Platform | 'all';
  onChange: (platform: Platform | 'all') => void;
}

export function PlatformFilter({ selected, onChange }: PlatformFilterProps) {
  const platforms: Array<{ value: Platform | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'aliexpress', label: 'AliExpress' },
    { value: 'ebay', label: 'eBay' },
    { value: 'taobao', label: '淘宝' },
    { value: 'pinduoduo', label: '拼多多' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <Button
          key={platform.value}
          size="sm"
          variant={selected === platform.value ? 'primary' : 'outline'}
          onClick={() => onChange(platform.value)}
        >
          {platform.label}
        </Button>
      ))}
    </div>
  );
}

// 价格区间筛选器
export interface PriceRangeFilterProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

export function PriceRangeFilter({ min, max, onChange }: PriceRangeFilterProps) {
  const [minValue, setMinValue] = useState(min);
  const [maxValue, setMaxValue] = useState(max);

  const handleApply = () => {
    onChange(minValue, maxValue);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={minValue}
        onChange={(e) => setMinValue(Number(e.target.value))}
        placeholder="最低价"
        className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <span className="text-gray-500">-</span>
      <input
        type="number"
        value={maxValue}
        onChange={(e) => setMaxValue(Number(e.target.value))}
        placeholder="最高价"
        className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <Button size="sm" onClick={handleApply}>
        应用
      </Button>
    </div>
  );
}

// 高级筛选面板
export interface AdvancedFiltersProps {
  onApply: (filters: any) => void;
  onReset: () => void;
}

export function AdvancedFilters({ onApply, onReset }: AdvancedFiltersProps) {
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minTrendScore, setMinTrendScore] = useState(0);

  const handleApply = () => {
    onApply({
      platform: platform !== 'all' ? platform : undefined,
      minPrice,
      maxPrice,
      minTrendScore,
    });
  };

  const handleReset = () => {
    setPlatform('all');
    setMinPrice(0);
    setMaxPrice(10000);
    setMinTrendScore(0);
    onReset();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">平台</label>
          <PlatformFilter selected={platform} onChange={setPlatform} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">价格区间</label>
          <PriceRangeFilter min={minPrice} max={maxPrice} onChange={(min, max) => {
            setMinPrice(min);
            setMaxPrice(max);
          }} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最低趋势分数: {minTrendScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={minTrendScore}
            onChange={(e) => setMinTrendScore(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApply} className="flex-1">
            应用筛选
          </Button>
          <Button onClick={handleReset} variant="outline">
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
