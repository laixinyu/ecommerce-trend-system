import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  category: string | null;
  platform: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  setCategory: (category: string | null) => void;
  setPlatform: (platform: string | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  getActiveFilters: () => Record<string, string | number>;
}

const initialState = {
  category: null,
  platform: null,
  minPrice: null,
  maxPrice: null,
  sortBy: 'trend_score',
  sortOrder: 'desc' as const,
  searchQuery: '',
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCategory: (category: string | null) => set({ category }),
      setPlatform: (platform: string | null) => set({ platform }),
      setPriceRange: (minPrice: number | null, maxPrice: number | null) => set({ minPrice, maxPrice }),
      setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => set({ sortBy, sortOrder }),
      setSearchQuery: (searchQuery: string) => set({ searchQuery }),
      resetFilters: () => set(initialState),
      getActiveFilters: () => {
        const state = get();
        const filters: Record<string, string | number> = {};
        if (state.category) filters.category = state.category;
        if (state.platform) filters.platform = state.platform;
        if (state.minPrice !== null) filters.minPrice = state.minPrice;
        if (state.maxPrice !== null) filters.maxPrice = state.maxPrice;
        if (state.sortBy) {
          filters.sortBy = state.sortBy;
          filters.sortOrder = state.sortOrder;
        }
        if (state.searchQuery) filters.q = state.searchQuery;
        return filters;
      },
    }),
    {
      name: 'filter-storage',
    }
  )
);
