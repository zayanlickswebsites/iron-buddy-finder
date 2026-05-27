import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Dumbbell, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, profile, profileLoaded, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!profileLoaded) return;
    if (!profile || !profile.is_verified) navigate({ to: "/onboarding" });
    else navigate({ to: "/home" });
  }, [user, profile, profileLoaded, loading, navigate]);

  useEffect(() => {
    setTimedOut(false);
    const t = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [user?.id]);

  if (timedOut && (loading || (user && !profileLoaded))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-foreground font-medium">Taking longer than expected</p>
        <p className="text-sm text-muted-foreground">We couldn't load your profile. Please try again.</p>
        <button
          onClick={() => {
            setTimedOut(false);
            refreshProfile();
          }}
          className="mt-2 bg-primary text-primary-foreground font-semibold rounded-xl px-6 py-3"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Dumbbell className="w-10 h-10 text-primary animate-pulse" />
    </div>
  );
}
