import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-12">
        <Dumbbell className="w-7 h-7 text-primary" />
        <span className="text-2xl font-bold tracking-tight">GymLink</span>
      </div>
      <h1 className="text-3xl font-bold">Join the community</h1>
      <p className="text-muted-foreground mt-2">Find your training partners.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
        <input type="password" required placeholder="Password (min 6 chars)" minLength={6} value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
        <button disabled={busy}
          className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-50">
          {busy ? "Creating..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already a member? <Link to="/login" className="text-primary font-medium">Sign in</Link>
      </p>
    </div>
  );
}
