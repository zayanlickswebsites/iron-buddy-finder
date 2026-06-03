import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dumbbell, ChevronLeft, Search, X, Loader as Loader2 } from "lucide-react";
import { glassStyles } from "./signup";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

type Gym = { id: string; name: string; chain: string; suburb: string };

/* Training style tiles config */
const STYLE_TILES = [
  {
    key: "Powerlifting",
    label: "Powerlifting",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
        <line x1="7" y1="12" x2="17" y2="12"/>
        <line x1="3" y1="12" x2="5" y2="12"/>
        <line x1="19" y1="12" x2="21" y2="12"/>
      </svg>
    ),
  },
  {
    key: "Bodybuilding",
    label: "Bodybuilding",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2C9.8 2 8 3.8 8 6c0 1.6.9 3 2.2 3.7L9 11H7l-2 4h2v6h1v-6h8v6h1v-6h2l-2-4h-2l-1.2-1.3C15.1 9 16 7.6 16 6c0-2.2-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
      </svg>
    ),
  },
  {
    key: "Cardio",
    label: "Cardio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M13 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
        <path d="M6.5 20.5 10 14l3 4 2-4 2.5 2"/>
        <path d="m10 18-2.5 2.5"/>
      </svg>
    ),
  },
  {
    key: "CrossFit",
    label: "CrossFit",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2a1 1 0 0 1 .894.553l2.5 5 5.5.8a1 1 0 0 1 .554 1.706l-3.98 3.878.939 5.474a1 1 0 0 1-1.451 1.054L12 17.547l-4.956 2.918a1 1 0 0 1-1.451-1.054l.939-5.474L2.552 10.06A1 1 0 0 1 3.106 8.353l5.5-.8 2.5-5A1 1 0 0 1 12 2z"/>
      </svg>
    ),
  },
  {
    key: "General Fitness",
    label: "General Fitness",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
    ),
  },
] as const;

function validateName(val: string): string | null {
  if (!val.trim()) return "This field is required";
  return null;
}

function Onboarding() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [style, setStyle] = useState<string>("");
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);

  // Step 2
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymSearch, setGymSearch] = useState("");
  const [gymId, setGymId] = useState("");
  const [gymLabel, setGymLabel] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const gymSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (profile?.is_verified) navigate({ to: "/home" });
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setStyle(profile.training_style ?? "");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    supabase.from("gyms").select("*").order("chain").order("name").then(({ data }) => {
      if (data) setGyms(data as Gym[]);
    });
  }, []);

  useEffect(() => {
    if (step === 1) setTimeout(() => firstNameRef.current?.focus(), 350);
    if (step === 2) setTimeout(() => gymSearchRef.current?.focus(), 350);
  }, [step]);

  const filteredGyms = gyms.filter((g) => {
    const q = gymSearch.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.suburb.toLowerCase().includes(q);
  });

  const goToStep2 = () => {
    const fe = validateName(firstName);
    const le = validateName(lastName);
    setFirstNameError(fe);
    setLastNameError(le);
    if (fe || le || !style) {
      if (!style) toast.error("Please select a training style");
      return;
    }
    setSliding("left");
    setTimeout(() => { setStep(2); setSliding(null); }, 300);
  };

  const goBack = () => {
    setSliding("right");
    setTimeout(() => { setStep(1); setSliding(null); }, 300);
  };

  const complete = async () => {
    if (!gymId) { toast.error("Please select your gym"); return; }
    if (!memberId.trim()) { toast.error("Please enter your membership ID"); return; }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      first_name: firstName,
      last_name: lastName,
      training_style: style as never,
      gym_id: gymId,
      membership_id: memberId,
      is_verified: true,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("You're verified!");
    navigate({ to: "/home" });
  };

  const slideClass = sliding === "left"
    ? "translate-x-[-40px] opacity-0"
    : sliding === "right"
    ? "translate-x-[40px] opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <>
      <style>{glassStyles}{`
        .onboarding-slide {
          transition: transform 0.28s cubic-bezier(.4,0,.2,1), opacity 0.25s ease;
        }
        .style-tile {
          background: color-mix(in oklch, var(--color-card) 40%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 18px 8px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          color: var(--color-muted-foreground);
        }
        .style-tile:hover {
          border-color: rgba(255,255,255,0.18);
          background: color-mix(in oklch, var(--color-card) 55%, transparent);
        }
        .style-tile.selected {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 15%, transparent),
                      inset 0 0 12px color-mix(in oklch, var(--color-primary) 8%, transparent);
          background: color-mix(in oklch, var(--color-card) 65%, transparent);
          color: var(--color-primary);
        }
        .gym-dropdown {
          background: color-mix(in oklch, var(--color-card) 80%, transparent);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          max-height: 220px;
          overflow-y: auto;
          position: absolute;
          left: 0; right: 0;
          top: calc(100% + 6px);
          z-index: 50;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .gym-option {
          padding: 11px 16px;
          cursor: pointer;
          transition: background 0.15s;
          display: flex; flex-direction: column; gap: 2px;
        }
        .gym-option:hover {
          background: color-mix(in oklch, var(--color-primary) 12%, transparent);
        }
        .progress-seg {
          height: 3px; flex: 1; border-radius: 99px;
          transition: background 0.3s;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 py-10 overflow-hidden relative"
        style={{ background: "var(--color-background)" }}
      >
        {/* Blobs */}
        <div
          className="blob-bg"
          style={{
            width: 360, height: 360, top: "-60px", right: "-80px",
            background: "color-mix(in oklch, var(--color-primary) 8%, transparent)",
            animation: "blobMove1 20s ease-in-out infinite",
          }}
        />
        <div
          className="blob-bg"
          style={{
            width: 280, height: 280, bottom: "20px", left: "-60px",
            background: "color-mix(in oklch, var(--color-card) 10%, transparent)",
            animation: "blobMove3 24s ease-in-out infinite",
          }}
        />

        <div className={`w-full max-w-sm relative z-10 onboarding-slide ${slideClass}`}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="flex items-center gap-2"
              style={{ filter: "drop-shadow(0 0 16px color-mix(in oklch, var(--color-primary) 28%, transparent))" }}
            >
              <Dumbbell className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold text-foreground">GymLink</span>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-6">
            <div className="progress-seg" style={{ background: step >= 1 ? "var(--color-primary)" : "var(--color-border)" }} />
            <div className="progress-seg" style={{ background: step >= 2 ? "var(--color-primary)" : "var(--color-border)" }} />
          </div>

          {step === 1 ? (
            <div className="glass-card p-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">Set up your profile</h1>
              <p className="text-sm text-muted-foreground mb-6">Tell us about your training.</p>

              <div className="space-y-4">
                {/* First name */}
                <div>
                  <div className="input-wrapper">
                    <input
                      ref={firstNameRef}
                      placeholder="First name"
                      value={firstName}
                      autoComplete="given-name"
                      onChange={(e) => { setFirstName(e.target.value); setFirstNameError(null); }}
                      onBlur={() => setFirstNameError(validateName(firstName))}
                      className={`glass-input glass-input-no-icon${firstNameError ? " error" : ""}`}
                    />
                  </div>
                  {firstNameError && <p className="field-error">{firstNameError}</p>}
                </div>

                {/* Last name */}
                <div>
                  <div className="input-wrapper">
                    <input
                      placeholder="Last name"
                      value={lastName}
                      autoComplete="family-name"
                      onChange={(e) => { setLastName(e.target.value); setLastNameError(null); }}
                      onBlur={() => setLastNameError(validateName(lastName))}
                      className={`glass-input glass-input-no-icon${lastNameError ? " error" : ""}`}
                    />
                  </div>
                  {lastNameError && <p className="field-error">{lastNameError}</p>}
                </div>

                {/* Training style tiles */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
                    Training style
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_TILES.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setStyle(t.key)}
                        className={`style-tile${style === t.key ? " selected" : ""}`}
                      >
                        {t.icon}
                        <span className="text-sm font-semibold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="glass-btn-primary"
                  disabled={!firstName.trim() || !lastName.trim() || !style}
                  onClick={goToStep2}
                  style={{ marginTop: 4 }}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="text-2xl font-bold text-foreground mb-1">Verify your gym</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Connect your membership to unlock the community.
              </p>

              <div className="space-y-4">
                {/* Searchable gym dropdown */}
                <div>
                  <div className="input-wrapper relative">
                    {gymId ? (
                      <div
                        className="glass-input glass-input-no-icon flex items-center justify-between cursor-pointer"
                        style={{ paddingRight: 40 }}
                        onClick={() => { setGymId(""); setGymLabel(""); setGymSearch(""); setDropdownOpen(true); }}
                      >
                        <span className="text-foreground">{gymLabel}</span>
                      </div>
                    ) : (
                      <input
                        ref={gymSearchRef}
                        placeholder="Search your gym..."
                        value={gymSearch}
                        onChange={(e) => { setGymSearch(e.target.value); setDropdownOpen(true); }}
                        onFocus={() => setDropdownOpen(true)}
                        className="glass-input"
                        style={{ paddingLeft: 40 }}
                        autoComplete="off"
                      />
                    )}
                    {!gymId && (
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-muted-foreground)", lineHeight: 0 }}>
                        <Search className="w-4 h-4" />
                      </span>
                    )}
                    {gymId && (
                      <button
                        type="button"
                        className="input-eye"
                        onClick={() => { setGymId(""); setGymLabel(""); setGymSearch(""); }}
                        tabIndex={-1}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {dropdownOpen && !gymId && filteredGyms.length > 0 && (
                      <div className="gym-dropdown">
                        {filteredGyms.map((g) => (
                          <div
                            key={g.id}
                            className="gym-option"
                            onClick={() => {
                              setGymId(g.id);
                              setGymLabel(`${g.name} — ${g.suburb}`);
                              setGymSearch("");
                              setDropdownOpen(false);
                            }}
                          >
                            <span className="text-sm font-semibold text-foreground">{g.name}</span>
                            <span className="text-xs text-muted-foreground">{g.suburb}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Membership ID */}
                <div>
                  <div className="input-wrapper">
                    <input
                      placeholder="Membership ID"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      className="glass-input glass-input-no-icon"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your membership ID is on your gym key tag or app
                  </p>
                </div>

                <button
                  type="button"
                  className="glass-btn-primary"
                  disabled={busy || !gymId || !memberId.trim()}
                  onClick={complete}
                  style={{ marginTop: 4 }}
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
