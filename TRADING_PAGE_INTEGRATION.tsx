// pages/dashboard/trading.tsx or app/(dashboard)/trading/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { TradingDashboard } from "@/components/trading/TradingDashboard";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export default function TradingPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/auth/login");
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Authenticating...</div>;
  }

  return (
    <ProtectedRoute>
      <TradingDashboard userId={session?.user?.id || ""} />
    </ProtectedRoute>
  );
}
