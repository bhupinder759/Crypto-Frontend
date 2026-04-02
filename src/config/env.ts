import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_BACKEND_HTTP_URL: z.string().url().optional(),
  NEXT_PUBLIC_BACKEND_WS_URL: z.string().optional(),
});

const parsed = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_BACKEND_HTTP_URL: process.env.NEXT_PUBLIC_BACKEND_HTTP_URL,
  NEXT_PUBLIC_BACKEND_WS_URL: process.env.NEXT_PUBLIC_BACKEND_WS_URL,
});

export const env = {
  appUrl: parsed.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  backendHttpUrl:
    parsed.NEXT_PUBLIC_BACKEND_HTTP_URL ?? "http://localhost:4000",
  backendWsUrl: parsed.NEXT_PUBLIC_BACKEND_WS_URL ?? "ws://localhost:4000/ws",
} as const;
