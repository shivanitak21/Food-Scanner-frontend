import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: ThemePreference;
  hasCompletedOnboarding: boolean;
  guestMode: boolean;
  setTheme: (theme: ThemePreference) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  enterGuest: () => void;
  exitGuest: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      hasCompletedOnboarding: false,
      guestMode: false,
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      enterGuest: () => set({ guestMode: true, hasCompletedOnboarding: true }),
      exitGuest: () => set({ guestMode: false }),
    }),
    {
      name: 'foodlens.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        guestMode: state.guestMode,
      }),
    },
  ),
);
