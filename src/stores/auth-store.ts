import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Technician } from '@/types';

type AuthState = {
  technician: Technician | null;
  ready: boolean;
  signIn: (employeeCode: string, name: string) => void;
  signOut: () => void;
  setReady: (ready: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      technician: null,
      ready: false,
      signIn: (employeeCode, name) => set({ technician: { employeeCode, name } }),
      signOut: () => set({ technician: null }),
      setReady: (ready) => set({ ready }),
    }),
    {
      name: 'medidores-agua-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ technician: state.technician }) as AuthState,
      onRehydrateStorage: () => (state) => state?.setReady(true),
    }
  )
);
