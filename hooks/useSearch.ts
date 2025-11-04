import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface SearchFilters {
  [key: string]: string | number | boolean;
}

export function useSearch(query: string, filters: SearchFilters = {}) {
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        ),
      });
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2分钟
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      return response.json();
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRelatedKeywords(keyword: string) {
  return useQuery({
    queryKey: ['related-keywords', keyword],
    queryFn: async () => {
      const response = await fetch(`/api/search/related?keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch related keywords');
      }
      return response.json();
    },
    enabled: !!keyword,
    staleTime: 10 * 60 * 1000, // 10分钟
  });
}

// 搜索历史管理
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const addToHistory = (query: string) => {
    const newHistory = [query, ...history.filter((h) => h !== query)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return { history, addToHistory, clearHistory };
}
