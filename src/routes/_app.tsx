import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { Dumbbell } from "lucide-react";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!profile?.is_verified) navigate({ to: "/onboarding" });
  }, [user, profile, loading, navigate]);

  if (loading || !profile?.is_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="w-10 h-10 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto">
      <Outlet />
      <BottomNav />
    </div>
  );
}
