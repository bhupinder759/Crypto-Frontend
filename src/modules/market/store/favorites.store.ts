"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type FavoritesState = {
  favorites: string[];
  toggle: (symbol: string) => void;
};

/** Watchlist persisted per browser (moves to the user profile once an API exists). */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favorites: [],
      toggle: (symbol) =>
        set((state) => ({
          favorites: state.favorites.includes(symbol)
            ? state.favorites.filter((s) => s !== symbol)
            : [...state.favorites, symbol],
        })),
    }),
    {
      name: "nexfin-favorites",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
