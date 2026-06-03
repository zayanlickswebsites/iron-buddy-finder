import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell, Eye, EyeOff, Loader as Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels: { score: number; label: string; color: string }[] = [
    { score: 0, label: "", color: "transparent" },
    { score: 1, label: "Weak", color: "var(--color-destructive)" },
    { score: 2, label: "Fair", color: "#F59E0B" },
    { score: 3, label: "Good", color: "oklch(0.76 0.18 155 / 70%)" },
    { score: 4, label: "Strong", color: "var(--color-success)" },
  ];
  return levels[score] ?? levels[0];
}

function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export const glassStyles = `
  @keyframes blobMove1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(60px, -40px) scale(1.05); }
    66% { transform: translate(-30px, 50px) scale(0.95); }
  }
  @keyframes blobMove2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(-70px, 30px) scale(1.08); }
    75% { transform: translate(40px, -60px) scale(0.92); }
  }
  @keyframes blobMove3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40% { transform: translate(50px, 70px) scale(1.03); }
    80% { transform: translate(-60px, -20px) scale(0.97); }
  }
  .blob-bg {
    position: absolute; border-radius: 50%;
    filter: blur(100px); pointer-events: none;
  }
  .glass-card {
    background: color-mix(in oklch, var(--color-card) 60%, transparent);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 16px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .glass-input {
    background: color-mix(in oklch, var(--color-card) 40%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
    color: var(--color-foreground);
    width: 100%;
    padding: 13px 44px 13px 16px;
    font-size: 15px;
    outline: none;
    font-family: inherit;
  }
  .glass-input-no-icon {
    padding-right: 16px !important;
  }
  .glass-input::placeholder { color: var(--color-muted-foreground); }
  .glass-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 15%, transparent);
  }
  .glass-input.error {
    border-color: var(--color-destructive) !important;
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-destructive) 12%, transparent) !important;
  }
  .glass-btn-primary {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: color-mix(in oklch, var(--color-primary) 85%, transparent);
    border: 1px solid color-mix(in oklch, var(--color-primary) 40%, transparent);
    box-shadow: 0 4px 24px color-mix(in oklch, var(--color-primary) 25%, transparent);
    border-radius: 12px;
    width: 100%;
    height: 56px;
    font-weight: 700;
    font-size: 15px;
    color: #fff;
    cursor: pointer;
    transition: box-shadow 0.15s, opacity 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: inherit;
  }
  .glass-btn-primary:hover:not(:disabled) {
    box-shadow: 0 4px 32px color-mix(in oklch, var(--color-primary) 40%, transparent);
  }
  .glass-btn-primary:active:not(:disabled) {
    box-shadow: 0 4px 40px color-mix(in oklch, var(--color-primary) 55%, transparent);
  }
  .glass-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .glass-btn-secondary {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: color-mix(in oklch, var(--color-card) 60%, transparent);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    width: 100%;
    height: 56px;
    font-weight: 600;
    font-size: 15px;
    color: var(--color-foreground);
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    font-family: inherit;
  }
  .glass-btn-secondary:hover:not(:disabled) {
    background: color-mix(in oklch, var(--color-card) 75%, transparent);
    box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  }
  .glass-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .input-wrapper { position: relative; }
  .input-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    color: var(--color-muted-foreground); cursor: pointer; line-height: 0;
    background: none; border: none; padding: 0;
  }
  .field-error { font-size: 12px; color: var(--color-destructive); margin-top: 5px; }
`;

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const strength = getPasswordStrength(password);

  const handleGoogleSignup = async () => {
    setGoogleBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = confirm !== password ? "Passwords do not match" : null;
    setEmailError(eErr);
    setPassError(pErr);
    setConfirmError(cErr);
    if (eErr || pErr || cErr) return;

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        toast.error("An account with this email already exists. Try signing in instead.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Account created");
    navigate({ to: "/onboarding" });
  };

  return (
    <>
      <style>{glassStyles}</style>
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-10 overflow-hidden relative"
        style={{ background: "var(--color-background)" }}
      >
        {/* Animated blobs */}
        <div
          className="blob-bg"
          style={{
            width: 360, height: 360, top: "-80px", left: "-80px",
            background: "color-mix(in oklch, var(--color-primary) 9%, transparent)",
            animation: "blobMove1 18s ease-in-out infinite",
          }}
        />
        <div
          className="blob-bg"
          style={{
            width: 280, height: 280, bottom: "40px", right: "-60px",
            background: "color-mix(in oklch, var(--color-card) 12%, transparent)",
            animation: "blobMove2 22s ease-in-out infinite",
          }}
        />
        <div
          className="blob-bg"
          style={{
            width: 220, height: 220, bottom: "30%", left: "15%",
            background: "color-mix(in oklch, var(--color-primary) 7%, transparent)",
            animation: "blobMove3 26s ease-in-out infinite",
          }}
        />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative flex items-center justify-center mb-3"
              style={{ filter: "drop-shadow(0 0 24px color-mix(in oklch, var(--color-primary) 35%, transparent))" }}
            >
              <Dumbbell className="w-10 h-10 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">GymLink</span>
            <p className="text-sm mt-1 text-muted-foreground">Join the community</p>
          </div>

          {/* Glass card */}
          <div className="glass-card p-6">
            {/* Google button */}
            <button
              type="button"
              className="glass-btn-secondary mb-4"
              onClick={handleGoogleSignup}
              disabled={googleBusy}
            >
              {googleBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                or continue with email
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <div className="input-wrapper">
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="Email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    className={`glass-input glass-input-no-icon${emailError ? " error" : ""}`}
                  />
                </div>
                {emailError && <p className="field-error">{emailError}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="input-wrapper">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => { setPassword(e.target.value); setPassError(null); }}
                    onBlur={() => setPassError(validatePassword(password))}
                    className={`glass-input${passError ? " error" : ""}`}
                  />
                  <button
                    type="button"
                    className="input-eye"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : "var(--color-border)" }}
                      />
                    ))}
                    <span
                      className="text-xs font-medium ml-1 whitespace-nowrap"
                      style={{ color: strength.score > 0 ? strength.color : "var(--color-muted-foreground)", minWidth: 38 }}
                    >
                      {strength.label}
                    </span>
                  </div>
                )}
                {passError && <p className="field-error">{passError}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <div className="input-wrapper">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirm}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirm(e.target.value); setConfirmError(null); }}
                    onBlur={() => setConfirmError(confirm !== password ? "Passwords do not match" : null)}
                    className={`glass-input${confirmError ? " error" : ""}`}
                  />
                  <button
                    type="button"
                    className="input-eye"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmError && <p className="field-error">{confirmError}</p>}
              </div>

              <button type="submit" className="glass-btn-primary" disabled={busy}>
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
