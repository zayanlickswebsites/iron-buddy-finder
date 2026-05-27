import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { TRAINING_TYPES, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { Plus, X, Users, Activity, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_app/home")({ component: HomePage });

type Checkin = {
  id: string;
  user_id: string;
  training_type: string;
  is_open_to_join: boolean;
  checked_in_at: string;
  is_active: boolean;
};

const THREE_HRS = 3 * 60 * 60 * 1000;

function HomePage() {
  const { user, profile } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [myCheckin, setMyCheckin] = useState<Checkin | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [gymName, setGymName] = useState("");

  const fresh = (c: Checkin) =>
    c.is_active && Date.now() - new Date(c.checked_in_at).getTime() < THREE_HRS;

  const load = async () => {
    if (!profile?.gym_id || !user) return;
    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("gym_id", profile.gym_id)
      .eq("is_active", true)
      .order("checked_in_at", { ascending: false });
    const list = ((data ?? []) as Checkin[]).filter(fresh);
    setCheckins(list);
    setMyCheckin(list.find((c) => c.user_id === user.id) ?? null);
  };

  useEffect(() => {
    if (!profile?.gym_id) return;
    load();
    supabase.from("gyms").select("name").eq("id", profile.gym_id).maybeSingle()
      .then(({ data }) => setGymName((data as { name?: string } | null)?.name ?? ""));

    const channel = supabase
      .channel("checkins-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins" }, () => load())
      .subscribe();
    const interval = setInterval(load, 60_000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.gym_id, user?.id]);

  const checkOut = async () => {
    if (!myCheckin) return;
    await supabase.from("checkins").update({ is_active: false }).eq("id", myCheckin.id);
    setMyCheckin(null); load();
    toast.success("Checked out");
  };

  return (
    <div className="px-5 pt-12">
      <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{gymName}</div>
      <h1 className="text-3xl font-bold">Live Now</h1>
      <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span><span className="text-foreground font-semibold">{checkins.length}</span> {checkins.length === 1 ? "member" : "members"} training now</span>
      </div>

      <div className="mt-6">
        {myCheckin ? (
          <div className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">You're checked in</div>
              <div className="text-lg font-bold mt-0.5">{myCheckin.training_type}</div>
              <div className="text-xs opacity-80">{timeAgo(myCheckin.checked_in_at)}</div>
            </div>
            <button onClick={checkOut} className="bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-full p-2.5">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowDialog(true)}
            className="w-full bg-primary text-primary-foreground font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 active:scale-[0.98] transition">
            <Plus className="w-5 h-5" />
            Check In
          </button>
        )}
      </div>

      <div className="mt-8 space-y-3 pb-4">
        {checkins.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No one's training yet.<br />Be the first to check in.</p>
          </div>
        )}
        {checkins.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">{c.training_type}</div>
                <div className="text-xs text-muted-foreground mt-1">{timeAgo(c.checked_in_at)}</div>
              </div>
              {c.is_open_to_join ? (
                <span className="shrink-0 bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  Open to Join
                </span>
              ) : (
                <span className="shrink-0 bg-muted text-muted-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  Solo Session
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showDialog && (
        <CheckInDialog
          gymId={profile!.gym_id!}
          userId={user!.id}
          onClose={() => setShowDialog(false)}
          onDone={() => { setShowDialog(false); load(); }}
        />
      )}
    </div>
  );
}

function CheckInDialog({ gymId, userId, onClose, onDone }: {
  gymId: string; userId: string; onClose: () => void; onDone: () => void;
}) {
  const [type, setType] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    // Mark any existing as inactive
    await supabase.from("checkins").update({ is_active: false })
      .eq("user_id", userId).eq("is_active", true);
    const { error } = await supabase.from("checkins").insert({
      user_id: userId, gym_id: gymId, training_type: type as never,
      is_open_to_join: open,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Checked in!");
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="bg-card border-t border-border rounded-t-3xl w-full max-w-md mx-auto p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-bold">What are you training?</h2>
        <div className="grid grid-cols-2 gap-2 mt-5">
          {TRAINING_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                type === t ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
              }`}>{t}</button>
          ))}
        </div>
        <label className="flex items-center justify-between mt-6 bg-background border border-border rounded-xl px-4 py-3.5">
          <div>
            <div className="font-medium text-sm">Open to join</div>
            <div className="text-xs text-muted-foreground">Let others request to train with you</div>
          </div>
          <button type="button" onClick={() => setOpen(!open)}
            className={`relative w-11 h-6 rounded-full transition ${open ? "bg-primary" : "bg-border"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition ${open ? "translate-x-5" : ""}`} />
          </button>
        </label>
        <button disabled={!type || busy} onClick={submit}
          className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3.5 mt-6 disabled:opacity-50">
          {busy ? "Checking in..." : "Check In"}
        </button>
      </div>
    </div>
  );
}
