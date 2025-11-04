import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  viewMode: 'grid' | 'list';
  compactMode: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setCompactMode: (compact: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light' as const,
      sidebarOpen: true,
      viewMode: 'grid' as const,
      compactMode: false,
      toggleTheme: () =>
        set((state: UIState) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      toggleSidebar: () =>
        set((state: UIState) => ({
          sidebarOpen: !state.sidebarOpen,
        })),
      setViewMode: (viewMode: 'grid' | 'list') => set({ viewMode }),
      setCompactMode: (compactMode: boolean) => set({ compactMode }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
