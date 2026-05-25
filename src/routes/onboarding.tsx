import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TRAINING_STYLES } from "@/lib/format";
import { Dumbbell, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

type Gym = { id: string; name: string; chain: string; suburb: string };

function Onboarding() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [style, setStyle] = useState<string>("");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymId, setGymId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);

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

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      first_name: firstName, last_name: lastName,
      training_style: style as never,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    setStep(2);
  };

  const verifyGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      gym_id: gymId, membership_id: memberId, is_verified: true,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("You're verified!");
    navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-12 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Dumbbell className="w-6 h-6 text-primary" />
        <span className="text-xl font-bold">GymLink</span>
      </div>

      <div className="flex gap-2 mb-8">
        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-border"}`} />
        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-border"}`} />
      </div>

      {step === 1 ? (
        <>
          <h1 className="text-2xl font-bold">Set up your profile</h1>
          <p className="text-muted-foreground mt-1 mb-8">Tell us about your training.</p>
          <form onSubmit={saveProfile} className="space-y-4">
            <input required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
            <input required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Primary training style</label>
              <div className="grid grid-cols-2 gap-2">
                {TRAINING_STYLES.map((s) => (
                  <button type="button" key={s} onClick={() => setStyle(s)}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                      style === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                    }`}>{s}</button>
                ))}
              </div>
            </div>
            <button disabled={busy || !style}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-50 mt-4">
              Continue
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Verify your gym</h1>
          <p className="text-muted-foreground mt-1 mb-8">Connect your membership to unlock the community.</p>
          <form onSubmit={verifyGym} className="space-y-4">
            <select required value={gymId} onChange={(e) => setGymId(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary">
              <option value="">Select your gym</option>
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>{g.name} — {g.suburb}</option>
              ))}
            </select>
            <input required placeholder="Membership ID" value={memberId} onChange={(e) => setMemberId(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
            <button disabled={busy}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {busy ? "Verifying..." : "Verify & Continue"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-muted-foreground py-2">
              Back
            </button>
          </form>
        </>
      )}
    </div>
  );
}
