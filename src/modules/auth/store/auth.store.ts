"use client";

import { create } from "zustand";
import type { AccountDto, SessionPayload, UserDto } from "@/modules/auth/types";

type AuthState = {
  user: UserDto | null;
  account: AccountDto | null;
  hydrated: boolean;
  setSession: (session: SessionPayload) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  account: null,
  hydrated: false,
  setSession: (session) =>
    set({
      user: session.user,
      account: session.account,
      hydrated: true,
    }),
  clearSession: () =>
    set({
      user: null,
      account: null,
      hydrated: true,
    }),
  setHydrated: (value) => set({ hydrated: value }),
}));
