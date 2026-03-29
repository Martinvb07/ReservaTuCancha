import { create } from 'zustand';
import type { Court } from '@/types';

interface BookingDraft {
  court: Court | null;
  date: string;
  startTime: string;
  endTime: string;
  players: number;
  totalPrice: number;
}

interface BookingStore {
  draft: BookingDraft;
  setDraft: (partial: Partial<BookingDraft>) => void;
  resetDraft: () => void;
}

const initialDraft: BookingDraft = {
  court: null,
  date: '',
  startTime: '',
  endTime: '',
  players: 1,
  totalPrice: 0,
};

export const useBookingStore = create<BookingStore>((set) => ({
  draft: initialDraft,
  setDraft: (partial) =>
    set((state) => ({ draft: { ...state.draft, ...partial } })),
  resetDraft: () => set({ draft: initialDraft }),
}));
