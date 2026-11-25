"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/constants/routes";
import { loginSchema, type LoginSchema } from "@/modules/auth/schema/auth.schema";
import { useLoginMutation } from "@/modules/auth/hooks/use-auth-session";

export function LoginForm({ next = null }: { next?: string | null }) {
  const router = useRouter();
  const mutation = useLoginMutation();
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const session = await mutation.mutateAsync(values);
          router.replace(
            (next ??
              (session.user.role === "ADMIN"
                ? routes.admin
                : routes.dashboard)) as Route,
          );
          router.refresh();
        } catch (error) {
          form.setError("root", {
            message:
              error instanceof Error ? error.message : "Login request failed",
          });
        }
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
        <p className="text-xs text-rose-500">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register("password")} />
        <p className="text-xs text-rose-500">
          {form.formState.errors.password?.message}
        </p>
      </div>
      <Button className="h-11 w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Signing in..." : "Sign in"}
      </Button>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-rose-500">{form.formState.errors.root.message}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        No account yet?{" "}
        <Link className="font-medium text-primary" href={routes.register}>
          Create one
        </Link>
      </p>
    </form>
  );
}
