"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAccount,
  getSession,
  login,
  logout,
  register,
} from "@/modules/auth/services/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { LoginInput, RegisterInput } from "@/modules/auth/types";

export function useSessionQuery(enabled = true) {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const query = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    enabled,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) {
      setSession(query.data);
    }
  }, [query.data, setSession]);

  useEffect(() => {
    if (query.error) {
      clearSession();
    }
  }, [clearSession, query.error]);

  return query;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginInput) => login(payload),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(["session"], session);
      toast.success("Signed in successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: RegisterInput) => register(payload),
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(["session"], session);
      toast.success("Account created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearSession();
      queryClient.clear();
      toast.success("Signed out");
    },
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (country: string) => createAccount(country),
    onSuccess: (account) => {
      if (currentUser) {
        const nextSession = { user: currentUser, account };
        setSession(nextSession);
        queryClient.setQueryData(["session"], nextSession);
      }
      toast.success("Trading account created");
    },
  });
}
