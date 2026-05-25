import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { TRAINING_STYLES } from "@/lib/format";
import { toast } from "sonner";
import { LogOut, Pencil, Calendar, MapPin, Dumbbell, Activity } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [gymName, setGymName] = useState("");
  const [checkinCount, setCheckinCount] = useState(0);
  const [upcoming, setUpcoming] = useState<{ id: string; title: string; event_date: string }[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!profile?.gym_id || !user) return;
    supabase.from("gyms").select("name").eq("id", profile.gym_id).maybeSingle()
      .then(({ data }) => setGymName((data as { name?: string } | null)?.name ?? ""));
    supabase.from("checkins").select("*", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setCheckinCount(count ?? 0));
    supabase.from("rsvps").select("event_id").eq("user_id", user.id).then(async ({ data }) => {
      const ids = ((data ?? []) as { event_id: string }[]).map((r) => r.event_id);
      if (!ids.length) return setUpcoming([]);
      const { data: evs } = await supabase.from("events")
        .select("id,title,event_date").in("id", ids)
        .gte("event_date", new Date().toISOString()).order("event_date");
      setUpcoming((evs ?? []) as { id: string; title: string; event_date: string }[]);
    });
  }, [profile?.gym_id, user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (!profile) return null;
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <button onClick={() => setEditing(true)} className="text-muted-foreground p-2">
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
          {initials || "?"}
        </div>
        <div>
          <div className="text-xl font-bold">{profile.first_name} {profile.last_name}</div>
          <div className="text-sm text-muted-foreground">{profile.training_style}</div>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-2xl p-4 space-y-3">
        <Row icon={<MapPin className="w-4 h-4" />} label="Gym" value={gymName} />
        <Row icon={<Activity className="w-4 h-4" />} label="All-time check-ins" value={String(checkinCount)} />
        {profile.is_admin && <Row icon={<Dumbbell className="w-4 h-4" />} label="Role" value="Admin" />}
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Upcoming Events
        </div>
        {upcoming.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-card border border-border rounded-2xl p-4 text-center">
            No upcoming events
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => (
              <div key={e.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-medium text-sm">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.event_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleSignOut}
        className="w-full mt-8 bg-card border border-border rounded-xl py-3.5 font-semibold text-destructive flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      {editing && <EditProfile onClose={() => setEditing(false)} onDone={async () => { await refreshProfile(); setEditing(false); }} />}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon} {label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function EditProfile({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { profile, user } = useAuth();
  const [first, setFirst] = useState(profile?.first_name ?? "");
  const [last, setLast] = useState(profile?.last_name ?? "");
  const [style, setStyle] = useState(profile?.training_style ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("profiles").update({
      first_name: first, last_name: last, training_style: style as never,
    }).eq("id", user!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated"); onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="bg-card border-t border-border rounded-t-3xl w-full max-w-md mx-auto p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
        <form onSubmit={submit} className="space-y-3">
          <input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="First name"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
          <input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Last name"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary" />
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Training style</label>
            <div className="grid grid-cols-2 gap-2">
              {TRAINING_STYLES.map((s) => (
                <button key={s} type="button" onClick={() => setStyle(s)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                    style === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
          <button disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 mt-2">
            {busy ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
