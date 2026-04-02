"use client";

import { apiGet, apiPost } from "@/lib/api/api-client";
import type {
  AccountDto,
  LoginInput,
  RegisterInput,
  SessionPayload,
} from "@/modules/auth/types";

export async function login(payload: LoginInput) {
  return apiPost<SessionPayload, LoginInput>("/auth/login", payload);
}

export async function register(payload: RegisterInput) {
  return apiPost<SessionPayload, RegisterInput>("/auth/register", payload);
}

export async function logout() {
  return apiPost<{ success: true }>("/auth/logout");
}

export async function getSession() {
  return apiGet<SessionPayload>("/auth/me");
}

export async function createAccount(country: string) {
  return apiPost<AccountDto, { country: string }>("/account", { country });
}
