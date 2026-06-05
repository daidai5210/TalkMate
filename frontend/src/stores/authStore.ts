import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserPublic } from '../types';
import {
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from '../features/auth/authService';

interface AuthState {
  token: string | null;
  user: UserPublic | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, captcha: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      error: null,
      login: async (username, password) => {
        set({ loading: true, error: null });
        try {
          const result = await loginApi({ username, password });
          set({ token: result.token, user: result.user, loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '登录失败';
          set({ loading: false, error: message });
          throw err;
        }
      },
      register: async (username, password, captcha) => {
        set({ loading: true, error: null });
        try {
          await registerApi({ username, password, captcha });
          set({ loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '注册失败';
          set({ loading: false, error: message });
          throw err;
        }
      },
      logout: async () => {
        try {
          await logoutApi();
        } finally {
          set({ token: null, user: null });
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'talkmate-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
