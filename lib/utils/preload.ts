// 数据预加载工具
export function preloadData(url: string): void {
  if (typeof window === 'undefined') return;

  // 使用fetch预加载数据
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).catch(() => {
    // 静默失败，预加载不应该影响主流程
  });
}

export function preloadImage(src: string): void {
  if (typeof window === 'undefined') return;

  const img = new Image();
  img.src = src;
}

export function preloadImages(srcs: string[]): void {
  srcs.forEach(preloadImage);
}

// 预加载关键资源
export function preloadCriticalResources(): void {
  if (typeof window === 'undefined') return;

  // 预加载常用API端点
  const criticalEndpoints = [
    '/api/trends/dashboard',
    '/api/trends/categories',
  ];

  criticalEndpoints.forEach((endpoint) => {
    preloadData(endpoint);
  });
}

// 懒加载组件
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFunc);
}

import React from 'react';
