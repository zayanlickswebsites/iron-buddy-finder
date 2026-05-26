import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell, ArrowLeft, MailCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your email for the reset link.");
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

      <h1 className="text-3xl font-bold">Reset password</h1>
      <p className="text-muted-foreground mt-2">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {sent ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MailCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Check your inbox</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            We've sent a password reset link to <strong>{email}</strong>. It
            may take a few minutes to arrive.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-primary font-medium text-sm"
          >
            Send again
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
          />
          <button
            disabled={busy}
            className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-50"
          >
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
