CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  join_request_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_join_request ON public.messages(join_request_id, created_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper: can the current user access this join_request's chat?
CREATE OR REPLACE FUNCTION public.can_access_chat(_jr_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.join_requests jr
    JOIN public.checkins c ON c.id = jr.checkin_id
    WHERE jr.id = _jr_id
      AND jr.status = 'accepted'
      AND (jr.requester_id = auth.uid() OR c.user_id = auth.uid())
  );
$$;

CREATE POLICY "Chat participants view messages" ON public.messages
  FOR SELECT TO authenticated USING (public.can_access_chat(join_request_id));

CREATE POLICY "Chat participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_access_chat(join_request_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;