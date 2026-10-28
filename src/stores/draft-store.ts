import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ReadingDraft } from '@/types';

type DraftState = {
  draft: ReadingDraft | null;
  setDraft: (draft: ReadingDraft) => void;
  clearDraft: () => void;
};

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'medidores-agua-reading-draft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ draft: state.draft }) as DraftState,
    }
  )
);
