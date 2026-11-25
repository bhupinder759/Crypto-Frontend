"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAccount,
  getSession,
  login,
  logout,
  register,
} from "@/modules/auth/services/auth.api";
import type { LoginInput, RegisterInput } from "@/modules/auth/types";

export function useSessionQuery(enabled = true) {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginInput) => login(payload),
    onSuccess: (session) => {
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

  return useMutation({
    mutationFn: (payload: RegisterInput) => register(payload),
    onSuccess: (session) => {
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

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Signed out");
    },
  });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (country: string) => createAccount(country),
    onSuccess: async () => {
      const nextSession = await getSession();
      queryClient.setQueryData(["session"], nextSession);
      toast.success("Trading account created");
    },
  });
}
