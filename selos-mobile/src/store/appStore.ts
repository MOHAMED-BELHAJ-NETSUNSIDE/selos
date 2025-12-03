import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppState {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSyncCount: number;
  setOnline: (online: boolean) => void;
  setLastSync: (date: Date) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnline: navigator.onLine,
      lastSync: null,
      pendingSyncCount: 0,
      setOnline: (online: boolean) => set({ isOnline: online }),
      setLastSync: (date: Date) => set({ lastSync: date }),
      setPendingSyncCount: (count: number) => set({ pendingSyncCount: count }),
    }),
    {
      name: 'app-storage',
    }
  )
);

