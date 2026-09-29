import { create } from 'zustand';

import { fetchMe } from '@/services/api/authApi';
import { setUnauthorizedHandler } from '@/services/api/client';
import { clearToken, getToken, saveToken } from '@/services/storage/tokenStorage';
import type { User } from '@/types/models';
import { ApiError } from '@/utils/errors';

type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  offline: boolean;
  bootstrap: () => Promise<void>;
  setSession: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'booting',
  user: null,
  offline: false,
  bootstrap: async () => {
    const token = await getToken();
    if (!token) {
      set({ status: 'unauthenticated', user: null, offline: false });
      return;
    }
    try {
      const user = await fetchMe();
      set({ status: 'authenticated', user, offline: false });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearToken();
        set({ status: 'unauthenticated', user: null, offline: false });
        return;
      }
      set({ status: 'authenticated', user: get().user, offline: true });
    }
  },
  setSession: async (user, token) => {
    await saveToken(token);
    set({ status: 'authenticated', user, offline: false });
  },
  setUser: (user) => set({ user, offline: false }),
  signOut: async () => {
    await clearToken();
    set({ status: 'unauthenticated', user: null, offline: false });
  },
}));

setUnauthorizedHandler(() => {
  void useAuthStore.getState().signOut();
});
