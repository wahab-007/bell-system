import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, Organisation } from '../types/api';

interface AuthState {
  user?: AuthUser;
  organisation?: Organisation;
  accessToken?: string;
  refreshToken?: string;
  setSession: (payload: {
    user: AuthUser;
    organisation: Organisation;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      organisation: undefined,
      accessToken: undefined,
      refreshToken: undefined,
      setSession: (payload) => set(() => payload),
      clear: () => set({ user: undefined, organisation: undefined, accessToken: undefined, refreshToken: undefined }),
    }),
    { name: 'ubs-auth' },
  ),
);

export const useIsAuthenticated = () => !!useAuthStore((state) => state.accessToken && state.user);
