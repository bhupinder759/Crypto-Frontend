"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";
import { useLogoutMutation } from "@/modules/auth/hooks/use-auth-session";

export function LogoutButton() {
  const router = useRouter();
  const logoutMutation = useLogoutMutation();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={logoutMutation.isPending}
      onClick={async () => {
        await logoutMutation.mutateAsync();
        router.replace(routes.login);
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      {logoutMutation.isPending ? "Signing out..." : "Logout"}
    </Button>
  );
}
