import { create } from 'zustand';

import type { ProfileSeed } from '@/types/models';

interface QuickDraftState {
  pending: ProfileSeed | null;
  arm: (seed: ProfileSeed) => void;
  take: () => ProfileSeed | null;
}

export const useQuickDraftStore = create<QuickDraftState>((set, get) => ({
  pending: null,
  arm: (seed) => set({ pending: seed }),
  take: () => {
    const pending = get().pending;
    set({ pending: null });
    return pending;
  },
}));
