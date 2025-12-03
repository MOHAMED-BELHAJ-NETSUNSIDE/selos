import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  };
  typeUser?: {
    id: number;
    nom: string;
  };
  salesperson?: {
    id: number;
    login: string;
    code: string | null;
    firstName: string;
    lastName: string;
    depotName: string;
  };
  salespersonId?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => {
        localStorage.setItem('auth_token', token);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },
      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
      updateUser: (user: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

