"use client";

import { api } from "@/lib/api/axios";

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const response = await api.get<T>(url, { params });
  return response.data;
}

export async function apiPost<T, TBody = unknown>(url: string, body?: TBody) {
  const response = await api.post<T>(url, body);
  return response.data;
}
