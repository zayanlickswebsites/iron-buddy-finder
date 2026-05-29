import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { GYM_CHALLENGE_TYPES, INTER_COMP_TYPES, formatSeconds } from "@/lib/format";
import { toast } from "sonner";
import { Calendar, Trophy, Building2, Plus, X, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/_app/events")({ component: EventsPage });

type Tab = "events" | "challenges" | "competitions";

function EventsPage() {
  const [tab, setTab] = useState<Tab>("events");
  const [chooser, setChooser] = useState(false);
  const [autoOpen, setAutoOpen] = useState<Tab | null>(null);
  const { profile } = useAuth();
  const isAdmin = !!profile?.is_admin;

  const pick = (t: Tab) => {
    setTab(t);
    setAutoOpen(t);
    setChooser(false);
  };

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events</h1>
        {isAdmin && (
          <button
            onClick={() => setChooser(true)}
            aria-label="Create"
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ backgroundColor: "#3D6EFF", color: "#FFFFFF" }}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex gap-1 mt-5 bg-card border border-border rounded-xl p-1">
        {(["events", "challenges", "competitions"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}>
            {t === "competitions" ? "Inter-Gym" : t === "challenges" ? "Challenges" : "My Gym"}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "events" && <EventsList isAdmin={isAdmin} autoOpen={autoOpen === "events"} onAutoOpened={() => setAutoOpen(null)} />}
        {tab === "challenges" && <ChallengesList isAdmin={isAdmin} autoOpen={autoOpen === "challenges"} onAutoOpened={() => setAutoOpen(null)} />}
        {tab === "competitions" && <CompetitionsList isAdmin={isAdmin} autoOpen={autoOpen === "competitions"} onAutoOpened={() => setAutoOpen(null)} />}
      </div>
      {chooser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end" onClick={() => setChooser(false)}>
          <div className="bg-card border-t border-border rounded-t-3xl w-full max-w-md mx-auto p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold mb-4">Create</h2>
            <div className="space-y-2">
              {([
                ["events", "New Event", Calendar],
                ["challenges", "New Challenge", Trophy],
                ["competitions", "New Competition", Building2],
              ] as const).map(([k, label, Icon]) => (
                <button key={k} onClick={() => pick(k)}
                  className="w-full flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3.5 active:scale-[0.99] transition">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Events ---------------- */
type Event = { id: string; title: string; description: string | null; event_date: string; max_attendees: number | null; gym_id: string };

function EventsList({ isAdmin, autoOpen, onAutoOpened }: { isAdmin: boolean; autoOpen?: boolean; onAutoOpened?: () => void }) {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, number>>({});
  const [myRsvps, setMyRsvps] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [gymName, setGymName] = useState("");

  useEffect(() => { if (autoOpen) { setShowForm(true); onAutoOpened?.(); } }, [autoOpen, onAutoOpened]);

  const load = async () => {
    if (!profile?.gym_id) return;
    const { data } = await supabase.from("events").select("*")
      .eq("gym_id", profile.gym_id).order("event_date");
    const list = (data ?? []) as Event[];
    setEvents(list);
    if (list.length) {
      const { data: rs } = await supabase.from("rsvps").select("event_id,user_id")
        .in("event_id", list.map((e) => e.id));
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (rs ?? []).forEach((r) => {
        const rr = r as { event_id: string; user_id: string };
        counts[rr.event_id] = (counts[rr.event_id] ?? 0) + 1;
        if (rr.user_id === user?.id) mine.add(rr.event_id);
      });
      setRsvps(counts); setMyRsvps(mine);
    }
    const { data: g } = await supabase.from("gyms").select("name").eq("id", profile.gym_id).maybeSingle();
    setGymName((g as { name?: string } | null)?.name ?? "");
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.gym_id]);

  const toggleRsvp = async (eventId: string) => {
    if (myRsvps.has(eventId)) {
      await supabase.from("rsvps").delete().eq("event_id", eventId).eq("user_id", user!.id);
    } else {
      await supabase.from("rsvps").insert({ event_id: eventId, user_id: user!.id });
    }
    load();
  };

  return (
    <div>
      {isAdmin && (
        <button onClick={() => setShowForm(true)}
          className="w-full mb-4 bg-card border border-dashed border-border rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 text-primary">
          <Plus className="w-4 h-4" /> New Event
        </button>
      )}
      {events.length === 0 && (
        <Empty icon={<Calendar />} text="No events at your gym yet." />
      )}
      <div className="space-y-3">
        {events.map((e) => {
          const going = myRsvps.has(e.id);
          const date = new Date(e.event_date);
          return (
            <div key={e.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="text-lg font-bold mt-1 leading-tight">{e.title}</div>
                  {e.description && <p className="text-sm text-muted-foreground mt-1.5">{e.description}</p>}
                  <div className="text-xs text-muted-foreground mt-2">
                    {rsvps[e.id] ?? 0} going{e.max_attendees ? ` · ${e.max_attendees} spots` : ""}
                  </div>
                </div>
              </div>
              <button onClick={() => toggleRsvp(e.id)}
                className={`w-full mt-3 font-semibold rounded-xl py-2.5 text-sm ${
                  going ? "bg-primary/15 text-primary" : "bg-primary text-primary-foreground"
                }`}>
                {going ? "✓ Going" : "RSVP"}
              </button>
            </div>
          );
        })}
      </div>
      {showForm && (
        <EventForm gymId={profile!.gym_id!} gymName={gymName} userId={user!.id}
          onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function EventForm({ gymId, gymName, userId, onClose, onDone }: {
  gymId: string; gymName: string; userId: string; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [max, setMax] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const event_date = new Date(`${date}T${time}`).toISOString();
    const { error } = await supabase.from("events").insert({
      gym_id: gymId, title, description: desc, event_date,
      max_attendees: max ? parseInt(max) : null, created_by: userId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Event posted"); onDone();
  };

  return (
    <Sheet onClose={onClose} title="New Event">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inp} /></Field>
        <Field label="Description"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={inp} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date"><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} /></Field>
          <Field label="Time"><input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inp} /></Field>
        </div>
        <Field label="Location"><input disabled value={gymName} className={`${inp} opacity-60`} /></Field>
        <Field label="Max attendees (optional)"><input type="number" value={max} onChange={(e) => setMax(e.target.value)} className={inp} /></Field>
        <button disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 mt-2">
          {busy ? "Posting..." : "Post Event"}
        </button>
      </form>
    </Sheet>
  );
}

/* ---------------- Challenges ---------------- */
type Challenge = { id: string; title: string; challenge_type: keyof typeof GYM_CHALLENGE_TYPES; start_date: string; end_date: string; gym_id: string };

function ChallengesList({ isAdmin, autoOpen, onAutoOpened }: { isAdmin: boolean; autoOpen?: boolean; onAutoOpened?: () => void }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Challenge[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => { if (autoOpen) { setShowForm(true); onAutoOpened?.(); } }, [autoOpen, onAutoOpened]);

  const load = async () => {
    if (!profile?.gym_id) return;
    const { data } = await supabase.from("gym_challenges").select("*")
      .eq("gym_id", profile.gym_id).order("end_date", { ascending: false });
    setItems((data ?? []) as Challenge[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.gym_id]);

  return (
    <div>
      {isAdmin && (
        <button onClick={() => setShowForm(true)}
          className="w-full mb-4 bg-card border border-dashed border-border rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 text-primary">
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      )}
      {items.length === 0 && <Empty icon={<Trophy />} text="No challenges yet." />}
      <div className="space-y-3">
        {items.map((c) => {
          const meta = GYM_CHALLENGE_TYPES[c.challenge_type];
          const active = new Date(c.end_date) >= new Date(new Date().toDateString());
          return (
            <button key={c.id} onClick={() => setOpenId(c.id)}
              className="w-full text-left bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{meta.label}</span>
                {active && <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">LIVE</span>}
              </div>
              <div className="text-lg font-bold mt-1">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}
              </div>
            </button>
          );
        })}
      </div>
      {showForm && (
        <ChallengeForm gymId={profile!.gym_id!}
          onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); load(); }} />
      )}
      {openId && <ChallengeDetail challenge={items.find((i) => i.id === openId)!} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ChallengeForm({ gymId, onClose, onDone }: { gymId: string; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<keyof typeof GYM_CHALLENGE_TYPES>("highest_bench_press");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("gym_challenges").insert({
      gym_id: gymId, title, challenge_type: type, start_date: start, end_date: end, created_by: user!.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Challenge created"); onDone();
  };
  return (
    <Sheet onClose={onClose} title="New Challenge">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inp} /></Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as keyof typeof GYM_CHALLENGE_TYPES)} className={inp}>
            {Object.entries(GYM_CHALLENGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Start"><input required type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inp} /></Field>
          <Field label="End"><input required type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inp} /></Field>
        </div>
        <button disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 mt-2">
          {busy ? "Creating..." : "Create"}
        </button>
      </form>
    </Sheet>
  );
}

type Entry = { id: string; user_id: string; result: number };

function ChallengeDetail({ challenge, onClose }: { challenge: Challenge; onClose: () => void }) {
  const { user } = useAuth();
  const meta = GYM_CHALLENGE_TYPES[challenge.challenge_type];
  const [entries, setEntries] = useState<(Entry & { name: string })[]>([]);
  const [myEntry, setMyEntry] = useState<Entry | null>(null);
  const [val, setVal] = useState("");
  const [mins, setMins] = useState(""); const [secs, setSecs] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: ents } = await supabase.from("gym_challenge_entries")
      .select("id,user_id,result").eq("challenge_id", challenge.id);
    const list = (ents ?? []) as Entry[];
    const ids = list.map((e) => e.user_id);
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,first_name").in("id", ids);
      (profs ?? []).forEach((p) => { const pp = p as { id: string; first_name: string }; names[pp.id] = pp.first_name ?? "Member"; });
    }
    const ranked = list.map((e) => ({ ...e, name: names[e.user_id] ?? "Member" }));
    ranked.sort((a, b) => meta.timed ? a.result - b.result : b.result - a.result);
    setEntries(ranked);
    setMyEntry(list.find((e) => e.user_id === user?.id) ?? null);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [challenge.id]);

  const submit = async () => {
    setBusy(true);
    let result = 0;
    if (meta.timed) result = (parseInt(mins || "0") * 60) + parseInt(secs || "0");
    else result = parseFloat(val);
    if (!result) { setBusy(false); return toast.error("Enter a result"); }

    if (myEntry) {
      // Only update if it's a better result
      const better = meta.timed ? result < myEntry.result : result > myEntry.result;
      if (!better) { setBusy(false); return toast.error("Not better than your current result"); }
      const { error } = await supabase.from("gym_challenge_entries")
        .update({ result, updated_at: new Date().toISOString() }).eq("id", myEntry.id);
      if (error) { setBusy(false); return toast.error(error.message); }
    } else {
      const { error } = await supabase.from("gym_challenge_entries").insert({
        challenge_id: challenge.id, user_id: user!.id, result,
      });
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    setBusy(false);
    toast.success("Saved!"); setVal(""); setMins(""); setSecs(""); load();
  };

  return (
    <Sheet onClose={onClose} title={challenge.title}>
      <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">{meta.label}</div>
      <div className="text-xs text-muted-foreground mb-4">
        {new Date(challenge.start_date).toLocaleDateString()} – {new Date(challenge.end_date).toLocaleDateString()}
      </div>

      <div className="bg-background border border-border rounded-xl p-3 mb-4">
        <div className="text-xs text-muted-foreground mb-2">{myEntry ? "Update your result" : "Submit your result"}</div>
        {meta.timed ? (
          <div className="flex items-center gap-2">
            <input type="number" placeholder="min" value={mins} onChange={(e) => setMins(e.target.value)} className={`${inp} text-center`} />
            <span>:</span>
            <input type="number" placeholder="sec" value={secs} onChange={(e) => setSecs(e.target.value)} className={`${inp} text-center`} />
            <button onClick={submit} disabled={busy} className="bg-primary text-primary-foreground font-semibold rounded-lg px-4 py-2 text-sm">Save</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input type="number" step="0.5" placeholder={meta.unit} value={val} onChange={(e) => setVal(e.target.value)} className={inp} />
            <button onClick={submit} disabled={busy} className="bg-primary text-primary-foreground font-semibold rounded-lg px-4 py-2 text-sm">Save</button>
          </div>
        )}
        {myEntry && (
          <div className="text-xs text-primary mt-2">
            Your best: {meta.timed ? formatSeconds(myEntry.result) : `${myEntry.result} ${meta.unit}`}
          </div>
        )}
      </div>

      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Leaderboard</div>
      <div className="space-y-1.5">
        {entries.length === 0 && <div className="text-sm text-muted-foreground py-4 text-center">No entries yet</div>}
        {entries.map((e, i) => (
          <div key={e.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${e.user_id === user?.id ? "bg-primary/15 border border-primary/40" : "bg-background border border-border"}`}>
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{i + 1}</span>
              <span className="font-medium text-sm">{e.name}</span>
            </div>
            <span className="font-bold text-sm">{meta.timed ? formatSeconds(e.result) : `${e.result} ${meta.unit}`}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- Inter-Gym Competitions ---------------- */
type Competition = { id: string; title: string; description: string | null; competition_type: keyof typeof INTER_COMP_TYPES; start_date: string; end_date: string };

function CompetitionsList({ isAdmin, autoOpen, onAutoOpened }: { isAdmin: boolean; autoOpen?: boolean; onAutoOpened?: () => void }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<Competition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [myGymIds, setMyGymIds] = useState<Set<string>>(new Set());

  useEffect(() => { if (autoOpen) { setShowForm(true); onAutoOpened?.(); } }, [autoOpen, onAutoOpened]);

  const load = async () => {
    if (!profile?.gym_id) return;
    const { data: cgs } = await supabase.from("inter_competition_gyms")
      .select("competition_id,gym_id").eq("gym_id", profile.gym_id);
    const compIds = ((cgs ?? []) as { competition_id: string }[]).map((c) => c.competition_id);
    setMyGymIds(new Set(compIds));
    if (!compIds.length) { setItems([]); return; }
    const { data } = await supabase.from("inter_competitions").select("*").in("id", compIds).order("end_date", { ascending: false });
    setItems((data ?? []) as Competition[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.gym_id]);

  return (
    <div>
      {isAdmin && (
        <button onClick={() => setShowForm(true)}
          className="w-full mb-4 bg-card border border-dashed border-border rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 text-primary">
          <Plus className="w-4 h-4" /> New Competition
        </button>
      )}
      {items.length === 0 && <Empty icon={<Building2 />} text="Your gym isn't in any competition." />}
      <div className="space-y-3">
        {items.map((c) => {
          const meta = INTER_COMP_TYPES[c.competition_type];
          const active = new Date(c.end_date) >= new Date(new Date().toDateString());
          return (
            <button key={c.id} onClick={() => setOpenId(c.id)}
              className="w-full text-left bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{meta.label}</span>
                {active && <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">LIVE</span>}
              </div>
              <div className="text-lg font-bold mt-1">{c.title}</div>
              {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
            </button>
          );
        })}
      </div>
      {showForm && <CompetitionForm onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); load(); }} />}
      {openId && <CompetitionDetail competition={items.find((i) => i.id === openId)!} onClose={() => setOpenId(null)} />}
      {void myGymIds}
    </div>
  );
}

function CompetitionForm({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<keyof typeof INTER_COMP_TYPES>("total_bench_press");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allGyms, setAllGyms] = useState<{ id: string; name: string; chain: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("gyms").select("id,name,chain").order("chain").order("name").then(({ data }) => {
      setAllGyms((data ?? []) as { id: string; name: string; chain: string }[]);
    });
  }, []);

  const toggle = (id: string) => {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size < 2) return toast.error("Select at least 2 gyms");
    setBusy(true);
    const { data, error } = await supabase.from("inter_competitions").insert({
      title, description: desc, competition_type: type, start_date: start, end_date: end,
    }).select("id").single();
    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Failed"); }
    const compId = (data as { id: string }).id;
    const rows = Array.from(selected).map((gym_id) => ({ competition_id: compId, gym_id }));
    const { error: e2 } = await supabase.from("inter_competition_gyms").insert(rows);
    setBusy(false);
    if (e2) return toast.error(e2.message);
    toast.success("Competition created"); onDone();
  };

  return (
    <Sheet onClose={onClose} title="New Competition">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className={inp} /></Field>
        <Field label="Description"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className={inp} /></Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as keyof typeof INTER_COMP_TYPES)} className={inp}>
            {Object.entries(INTER_COMP_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Start"><input required type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inp} /></Field>
          <Field label="End"><input required type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inp} /></Field>
        </div>
        <Field label={`Gyms (${selected.size} selected)`}>
          <div className="max-h-48 overflow-y-auto space-y-1 bg-background border border-border rounded-xl p-2">
            {allGyms.map((g) => (
              <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card cursor-pointer">
                <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)} className="accent-[color:var(--color-primary)]" />
                <span className="text-sm">{g.name}</span>
              </label>
            ))}
          </div>
        </Field>
        <button disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 mt-2">
          {busy ? "Creating..." : "Create"}
        </button>
      </form>
    </Sheet>
  );
}

function CompetitionDetail({ competition, onClose }: { competition: Competition; onClose: () => void }) {
  const { user, profile } = useAuth();
  const meta = INTER_COMP_TYPES[competition.competition_type];
  const [board, setBoard] = useState<{ gym_id: string; name: string; score: number; contributors: number }[]>([]);
  const [myContribCount, setMyContribCount] = useState(0);
  const [myEntry, setMyEntry] = useState<{ id: string; result: number } | null>(null);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: gymsRows } = await supabase.from("inter_competition_gyms").select("gym_id").eq("competition_id", competition.id);
    const gymIds = ((gymsRows ?? []) as { gym_id: string }[]).map((g) => g.gym_id);
    if (!gymIds.length) return;
    const { data: gyms } = await supabase.from("gyms").select("id,name").in("id", gymIds);
    const nameMap: Record<string, string> = {};
    (gyms ?? []).forEach((g) => { const gg = g as { id: string; name: string }; nameMap[gg.id] = gg.name; });

    const scores: Record<string, { sum: number; count: number; contributors: Set<string> }> = {};
    gymIds.forEach((id) => scores[id] = { sum: 0, count: 0, contributors: new Set() });

    if (competition.competition_type === "total_checkins") {
      const { data: cks } = await supabase.from("checkins").select("gym_id,user_id,checked_in_at")
        .gte("checked_in_at", competition.start_date)
        .lte("checked_in_at", new Date(competition.end_date + "T23:59:59").toISOString())
        .in("gym_id", gymIds);
      (cks ?? []).forEach((c) => {
        const cc = c as { gym_id: string; user_id: string };
        const s = scores[cc.gym_id]; if (!s) return;
        s.sum += 1; s.count += 1; s.contributors.add(cc.user_id);
      });
    } else {
      const { data: ents } = await supabase.from("inter_competition_entries").select("user_id,gym_id,result").eq("competition_id", competition.id);
      (ents ?? []).forEach((e) => {
        const ee = e as { user_id: string; gym_id: string; result: number };
        const s = scores[ee.gym_id]; if (!s) return;
        s.sum += Number(ee.result); s.count += 1; s.contributors.add(ee.user_id);
      });
      const mine = (ents ?? []).find((e) => (e as { user_id: string }).user_id === user?.id) as { user_id: string; result: number; gym_id: string } | undefined;
      if (mine) {
        // fetch entry id
        const { data: full } = await supabase.from("inter_competition_entries").select("id,result").eq("competition_id", competition.id).eq("user_id", user!.id).maybeSingle();
        setMyEntry(full as { id: string; result: number } | null);
      } else setMyEntry(null);
    }

    const list = gymIds.map((id) => {
      const s = scores[id];
      let score = 0;
      if (competition.competition_type === "highest_avg_bench") score = s.count ? s.sum / s.count : 0;
      else if (competition.competition_type === "most_pbs") score = s.count;
      else score = s.sum;
      return { gym_id: id, name: nameMap[id] ?? "Gym", score, contributors: s.contributors.size };
    }).sort((a, b) => b.score - a.score);
    setBoard(list);
    const myGym = list.find((b) => b.gym_id === profile?.gym_id);
    setMyContribCount(myGym?.contributors ?? 0);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [competition.id]);

  const submit = async () => {
    if (competition.competition_type === "total_checkins") return;
    const v = parseFloat(val);
    if (!v) return toast.error("Enter a value");
    setBusy(true);
    if (myEntry) {
      const { error } = await supabase.from("inter_competition_entries")
        .update({ result: v, updated_at: new Date().toISOString() }).eq("id", myEntry.id);
      if (error) { setBusy(false); return toast.error(error.message); }
    } else {
      const { error } = await supabase.from("inter_competition_entries").insert({
        competition_id: competition.id, user_id: user!.id, gym_id: profile!.gym_id!, result: v,
      });
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    setBusy(false); setVal(""); toast.success("Saved!"); load();
  };

  const leader = board[0]?.score || 1;
  const auto = competition.competition_type === "total_checkins";

  return (
    <Sheet onClose={onClose} title={competition.title}>
      <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">{meta.label}</div>
      {competition.description && <p className="text-sm text-muted-foreground mb-4">{competition.description}</p>}

      {!auto && (
        <div className="bg-background border border-border rounded-xl p-3 mb-4">
          <div className="text-xs text-muted-foreground mb-2">{myEntry ? `Update your contribution (current: ${myEntry.result} ${meta.unit})` : "Submit your contribution"}</div>
          <div className="flex items-center gap-2">
            <input type="number" step="0.5" placeholder={meta.unit} value={val} onChange={(e) => setVal(e.target.value)} className={inp} />
            <button onClick={submit} disabled={busy} className="bg-primary text-primary-foreground font-semibold rounded-lg px-4 py-2 text-sm">Save</button>
          </div>
        </div>
      )}

      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Gym Leaderboard</div>
      <div className="space-y-2">
        {board.map((g, i) => {
          const mine = g.gym_id === profile?.gym_id;
          const pct = leader ? (g.score / leader) * 100 : 0;
          return (
            <div key={g.gym_id} className={`rounded-xl p-3 ${mine ? "bg-primary/10 border border-primary/40" : "bg-background border border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{i + 1}</span>
                  <span className="font-medium text-sm">{g.name}</span>
                </div>
                <span className="font-bold text-sm">{Math.round(g.score * 10) / 10} {meta.unit}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        <UsersIcon className="w-3.5 h-3.5 inline mr-1" />
        {myContribCount} {myContribCount === 1 ? "member" : "members"} from your gym have contributed
      </div>
    </Sheet>
  );
}

/* ---------------- Shared UI ---------------- */
const inp = "w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="w-10 h-10 mx-auto mb-3 opacity-30">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="bg-card border-t border-border rounded-t-3xl w-full max-w-md mx-auto p-6 pb-10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
