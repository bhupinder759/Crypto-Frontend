"use client";

import { useAuthStore } from "@/modules/auth/store/auth.store";

export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    account: state.account,
    setSession: state.setSession,
    clearSession: state.clearSession,
    hydrated: state.hydrated,
    setHydrated: state.setHydrated,
  }));
}
