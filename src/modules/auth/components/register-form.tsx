"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/constants/routes";
import {
  registerSchema,
  type RegisterSchema,
} from "@/modules/auth/schema/auth.schema";
import { useRegisterMutation } from "@/modules/auth/hooks/use-auth-session";

export function RegisterForm() {
  const router = useRouter();
  const mutation = useRegisterMutation();
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      country: "US",
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await mutation.mutateAsync(values);
          router.replace(routes.dashboard);
          router.refresh();
        } catch (error) {
          form.setError("root", {
            message:
              error instanceof Error ? error.message : "Registration request failed",
          });
        }
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input id="register-email" type="email" {...form.register("email")} />
        <p className="text-xs text-rose-500">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          {...form.register("password")}
        />
        <p className="text-xs text-rose-500">
          {form.formState.errors.password?.message}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input id="country" maxLength={2} {...form.register("country")} />
        <p className="text-xs text-rose-500">
          {form.formState.errors.country?.message}
        </p>
      </div>
      <Button className="h-11 w-full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating account..." : "Create account"}
      </Button>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-rose-500">{form.formState.errors.root.message}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link className="font-medium text-primary" href={routes.login}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
