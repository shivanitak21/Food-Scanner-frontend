import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ProfileSelectionState {
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
}

export const useProfileStore = create<ProfileSelectionState>()(
  persist(
    (set) => ({
      selectedProfileId: null,
      setSelectedProfileId: (selectedProfileId) => set({ selectedProfileId }),
    }),
    {
      name: 'foodlens.profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selectedProfileId: state.selectedProfileId }),
    },
  ),
);
