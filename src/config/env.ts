import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_BACKEND_HTTP_URL: z.string().url().optional(),
});

const parsed = envSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_BACKEND_HTTP_URL: process.env.NEXT_PUBLIC_BACKEND_HTTP_URL,
});

export const env = {
  appUrl: parsed.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  backendHttpUrl:
    parsed.NEXT_PUBLIC_BACKEND_HTTP_URL ?? "http://localhost:4000",
} as const;
