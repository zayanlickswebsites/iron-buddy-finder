import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-12">
        <Dumbbell className="w-7 h-7 text-primary" />
        <span className="text-2xl font-bold tracking-tight">GymLink</span>
      </div>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-2">Sign in to your gym community.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <input
          type="email" required placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
        />
        <input
          type="password" required placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary font-medium">
            Forgot password?
          </Link>
        </div>
        <button
          disabled={busy}
          className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-50"
        >
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        New here? <Link to="/signup" className="text-primary font-medium">Create an account</Link>
      </p>
    </div>
  );
}
