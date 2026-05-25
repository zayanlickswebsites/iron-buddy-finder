import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { Users, Dumbbell, Check, X } from "lucide-react";

export const Route = createFileRoute("/_app/workout")({ component: WorkoutPage });

type OpenSession = {
  id: string;
  user_id: string;
  training_type: string;
  checked_in_at: string;
};

type IncomingReq = {
  id: string;
  requester_id: string;
  checkin_id: string;
  status: string;
  requester_name: string | null;
};

type OutgoingReq = {
  id: string;
  checkin_id: string;
  status: string;
};

const THREE_HRS = 3 * 60 * 60 * 1000;

function WorkoutPage() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<OpenSession[]>([]);
  const [incoming, setIncoming] = useState<IncomingReq[]>([]);
  const [outgoing, setOutgoing] = useState<Record<string, OutgoingReq>>({});
  const [accepted, setAccepted] = useState<{ name: string }[]>([]);

  const load = async () => {
    if (!profile?.gym_id || !user) return;
    const { data: cks } = await supabase
      .from("checkins")
      .select("id,user_id,training_type,checked_in_at,is_active,is_open_to_join")
      .eq("gym_id", profile.gym_id)
      .eq("is_active", true)
      .eq("is_open_to_join", true)
      .order("checked_in_at", { ascending: false });
    const fresh = ((cks ?? []) as OpenSession[]).filter(
      (c) => Date.now() - new Date(c.checked_in_at).getTime() < THREE_HRS && c.user_id !== user.id
    );
    setSessions(fresh);

    // Outgoing (my requests)
    const { data: out } = await supabase
      .from("join_requests").select("id,checkin_id,status")
      .eq("requester_id", user.id);
    const map: Record<string, OutgoingReq> = {};
    (out ?? []).forEach((r) => (map[(r as OutgoingReq).checkin_id] = r as OutgoingReq));
    setOutgoing(map);

    // Incoming: requests for MY active checkin
    const { data: myCk } = await supabase
      .from("checkins").select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (myCk) {
      const ckId = (myCk as { id: string }).id;
      const { data: reqs } = await supabase
        .from("join_requests")
        .select("id,requester_id,checkin_id,status")
        .eq("checkin_id", ckId)
        .eq("status", "pending");
      const reqList = (reqs ?? []) as Omit<IncomingReq, "requester_name">[];
      const ids = reqList.map((r) => r.requester_id);
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id,first_name").in("id", ids);
        (profs ?? []).forEach((p) => {
          const pp = p as { id: string; first_name: string | null };
          names[pp.id] = pp.first_name ?? "Someone";
        });
      }
      setIncoming(reqList.map((r) => ({ ...r, requester_name: names[r.requester_id] ?? "Someone" })));

      // Accepted partners (people who requested to join me OR me joining others — accepted)
      const { data: acc } = await supabase
        .from("join_requests")
        .select("requester_id,checkin_id,status")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},checkin_id.eq.${ckId}`);
      const partnerIds = (acc ?? []).map((r) => {
        const rr = r as { requester_id: string; checkin_id: string };
        return rr.requester_id === user.id ? null : rr.requester_id;
      }).filter(Boolean) as string[];
      if (partnerIds.length) {
        const { data: profs } = await supabase
          .from("profiles").select("first_name").in("id", partnerIds);
        setAccepted((profs ?? []).map((p) => ({ name: (p as { first_name: string }).first_name ?? "" })));
      } else setAccepted([]);
    } else {
      setIncoming([]); setAccepted([]);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("workout-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "join_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.gym_id, user?.id]);

  const sendReq = async (checkinId: string) => {
    const { error } = await supabase.from("join_requests").insert({
      requester_id: user!.id, checkin_id: checkinId,
    });
    if (error) toast.error(error.message); else { toast.success("Request sent"); load(); }
  };

  const respond = async (reqId: string, accept: boolean) => {
    const { error } = await supabase.from("join_requests")
      .update({ status: accept ? "accepted" : "declined" }).eq("id", reqId);
    if (error) toast.error(error.message);
    else { toast.success(accept ? "Accepted" : "Declined"); load(); }
  };

  return (
    <div className="px-5 pt-12 pb-4">
      <h1 className="text-3xl font-bold">Find a Partner</h1>
      <p className="text-sm text-muted-foreground mt-1">Open sessions at your gym.</p>

      {incoming.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Requests ({incoming.length})
          </div>
          <div className="space-y-2">
            {incoming.map((r) => (
              <div key={r.id} className="bg-card border border-primary/40 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.requester_name}</div>
                  <div className="text-xs text-muted-foreground">wants to join your session</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(r.id, false)} className="bg-muted rounded-full p-2.5">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={() => respond(r.id, true)} className="bg-primary text-primary-foreground rounded-full p-2.5">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="mt-6 bg-primary/10 border border-primary/30 rounded-2xl p-4">
          <div className="text-sm">
            You're training with <span className="font-bold text-primary">{accepted.map((a) => a.name).join(", ")}</span> today
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {sessions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No open sessions right now.</p>
          </div>
        )}
        {sessions.map((s) => {
          const req = outgoing[s.id];
          return (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold leading-tight">{s.training_type}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{timeAgo(s.checked_in_at)}</div>
                </div>
              </div>
              {req ? (
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  req.status === "accepted" ? "bg-primary text-primary-foreground" :
                  req.status === "declined" ? "bg-muted text-muted-foreground" :
                  "bg-muted text-foreground"
                }`}>
                  {req.status === "pending" ? "Pending" : req.status === "accepted" ? "Accepted" : "Declined"}
                </span>
              ) : (
                <button onClick={() => sendReq(s.id)}
                  className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full">
                  Join
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
