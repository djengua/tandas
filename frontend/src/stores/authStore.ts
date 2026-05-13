import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nombre: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,

      login: async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        set({ user: res.user, token: res.access_token });
      },

      register: async (email: string, nombre: string, password: string) => {
        const res = await authApi.register({ email, nombre, password });
        set({ user: res.user, token: res.access_token });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      loadUser: async () => {
        const { token } = get();
        if (!token) {
          set({ loading: false });
          return;
        }
        try {
          const user = await authApi.me();
          set({ user, loading: false });
        } catch {
          set({ user: null, token: null, loading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
