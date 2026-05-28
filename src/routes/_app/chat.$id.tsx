import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat/$id")({ component: ChatPage });

type Msg = { id: string; sender_id: string; content: string; created_at: string };

function ChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [partnerName, setPartnerName] = useState("Training Partner");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,content,created_at")
      .eq("join_request_id", id)
      .order("created_at", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setMessages((data ?? []) as Msg[]);
  };

  const loadPartner = async () => {
    if (!user) return;
    const { data: jr } = await supabase
      .from("join_requests")
      .select("requester_id,checkin_id")
      .eq("id", id).maybeSingle();
    if (!jr) return;
    const jrr = jr as { requester_id: string; checkin_id: string };
    const { data: ck } = await supabase
      .from("checkins").select("user_id").eq("id", jrr.checkin_id).maybeSingle();
    const ownerId = (ck as { user_id: string } | null)?.user_id;
    const partnerId = jrr.requester_id === user.id ? ownerId : jrr.requester_id;
    if (!partnerId) return;
    const { data: prof } = await supabase
      .from("profiles").select("first_name,last_name").eq("id", partnerId).maybeSingle();
    const p = prof as { first_name: string | null; last_name: string | null } | null;
    if (p) setPartnerName([p.first_name, p.last_name].filter(Boolean).join(" ") || "Training Partner");
  };

  useEffect(() => {
    load(); loadPartner();
    const ch = supabase
      .channel(`chat-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `join_request_id=eq.${id}` },
        (p) => setMessages((m) => [...m, p.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      join_request_id: id, sender_id: user.id, content: body,
    });
    setSending(false);
    if (error) toast.error(error.message);
    else setText("");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Link to="/workout" className="p-1.5 -ml-1.5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <div className="font-bold truncate">{partnerName}</div>
          <div className="text-[11px] text-muted-foreground">Training partner</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Say hi 👋 — plan your session together.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                mine ? "bg-primary text-primary-foreground rounded-br-md"
                     : "bg-card border border-border rounded-bl-md"
              }`}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 px-3 py-3 border-t border-border bg-card pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
        <button type="submit" disabled={!text.trim() || sending}
          className="bg-primary text-primary-foreground rounded-full p-2.5 disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
