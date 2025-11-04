import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  preferredCategories: string[];
  preferredPlatforms: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

interface UserState {
  userId: string | null;
  email: string | null;
  preferences: UserPreferences;
  setUser: (userId: string, email: string) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      preferences: {
        preferredCategories: [],
        preferredPlatforms: [],
        minPrice: null,
        maxPrice: null,
      },
      setUser: (userId: string, email: string) => set({ userId, email }),
      setPreferences: (preferences: Partial<UserPreferences>) =>
        set((state: UserState) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
      clearUser: () =>
        set({
          userId: null,
          email: null,
          preferences: {
            preferredCategories: [],
            preferredPlatforms: [],
            minPrice: null,
            maxPrice: null,
          },
        }),
    }),
    {
      name: 'user-storage',
    }
  )
);
