import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat/$id")({ component: ChatPage });

type Msg = { id: string; sender_id: string; content: string; created_at: string; _pending?: boolean };

function ChatPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [partnerFirstName, setPartnerFirstName] = useState("Training Partner");
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,content,created_at")
        .eq("join_request_id", id)
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (error) { toast.error(error.message); return; }
      setMessages((data ?? []) as Msg[]);
      scrollToBottom(false);
    })();

    (async () => {
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
        .from("profiles").select("first_name").eq("id", partnerId).maybeSingle();
      const p = prof as { first_name: string | null } | null;
      if (p && mounted) setPartnerFirstName(p.first_name || "Training Partner");
    })();

    const ch = supabase
      .channel(`chat-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `join_request_id=eq.${id}` },
        (p) => {
          const incoming = p.new as Msg;
          setMessages((m) => {
            // Replace optimistic pending msg with same content from same sender
            const idx = m.findIndex((x) => x._pending && x.sender_id === incoming.sender_id && x.content === incoming.content);
            if (idx >= 0) {
              const next = [...m];
              next[idx] = incoming;
              return next;
            }
            if (m.some((x) => x.id === incoming.id)) return m;
            return [...m, incoming];
          });
          scrollToBottom(true);
        })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [id, user?.id]);

  useEffect(() => { scrollToBottom(true); }, [messages.length]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || !user) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Msg = {
      id: tempId, sender_id: user.id, content: body,
      created_at: new Date().toISOString(), _pending: true,
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    scrollToBottom(true);
    const { error } = await supabase.from("messages").insert({
      join_request_id: id, sender_id: user.id, content: body,
    });
    if (error) {
      toast.error(error.message);
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setText(body);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "#0A0A0F" }}>
      <header className="flex items-center gap-3 px-4 py-3 border-b" style={{ backgroundColor: "#13131A", borderColor: "#1E1E2A" }}>
        <Link to="/workout" className="p-1.5 -ml-1.5 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <div className="font-bold truncate" style={{ color: "#F0F0F5" }}>{partnerFirstName}</div>
          <div className="text-[11px]" style={{ color: "#5A5A72" }}>Training partner</div>
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-sm py-12" style={{ color: "#5A5A72" }}>
            Say hi 👋 — plan your session together.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm break-words ${
                  mine ? "rounded-br-md" : "rounded-bl-md border"
                } ${m._pending ? "opacity-70" : ""}`}
                style={mine
                  ? { backgroundColor: "#3D6EFF", color: "#FFFFFF" }
                  : { backgroundColor: "#13131A", borderColor: "#1E1E2A", color: "#F0F0F5" }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 px-3 py-3 border-t"
        style={{
          backgroundColor: "#13131A",
          borderColor: "#1E1E2A",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setTimeout(() => scrollToBottom(true), 250)}
          placeholder="Message"
          enterKeyHint="send"
          className="flex-1 rounded-full px-4 py-2.5 text-sm focus:outline-none"
          style={{ backgroundColor: "#0A0A0F", border: "1px solid #1E1E2A", color: "#F0F0F5" }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-full p-2.5 disabled:opacity-40"
          style={{ backgroundColor: "#3D6EFF", color: "#FFFFFF" }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
