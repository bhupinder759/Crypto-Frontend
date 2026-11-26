"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TicketState = {
  /** Price picked from the order book; `nonce` lets the ticket react to repeated clicks. */
  pickedPrice: { price: string; nonce: number } | null;
  /** Skip the confirm dialog (persisted per browser). */
  skipConfirm: boolean;
  pickPrice: (price: string) => void;
  setSkipConfirm: (value: boolean) => void;
};

export const useTicketStore = create<TicketState>()(
  persist(
    (set) => ({
      pickedPrice: null,
      skipConfirm: false,
      pickPrice: (price) =>
        set((state) => ({
          pickedPrice: { price, nonce: (state.pickedPrice?.nonce ?? 0) + 1 },
        })),
      setSkipConfirm: (skipConfirm) => set({ skipConfirm }),
    }),
    {
      name: "nexfin-ticket",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ skipConfirm: state.skipConfirm }),
      skipHydration: true,
    },
  ),
);
