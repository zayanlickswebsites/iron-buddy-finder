import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Token is valid — user can set a new password
        // No-op; we just let them submit the form
      }
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }
    if (password !== confirm) {
      return toast.error("Passwords do not match.");
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success("Password updated successfully!");
    setTimeout(() => navigate({ to: "/login" }), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-12">
        <Dumbbell className="w-7 h-7 text-primary" />
        <span className="text-2xl font-bold tracking-tight">GymLink</span>
      </div>

      <Link
        to="/login"
        className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>

      <h1 className="text-3xl font-bold">New password</h1>
      <p className="text-muted-foreground mt-2">
        Create a new password for your account.
      </p>

      {done ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Password updated</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Redirecting you to the login screen...
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <input
            type="password"
            required
            minLength={6}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
          />
          <button
            disabled={busy}
            className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-50"
          >
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
