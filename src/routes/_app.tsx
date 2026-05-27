import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { Dumbbell } from "lucide-react";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { user, profile, profileLoaded, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!profileLoaded) return;
    if (!profile || !profile.is_verified) navigate({ to: "/onboarding" });
  }, [user, profile, profileLoaded, loading, navigate]);

  if (loading || !user) {
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
