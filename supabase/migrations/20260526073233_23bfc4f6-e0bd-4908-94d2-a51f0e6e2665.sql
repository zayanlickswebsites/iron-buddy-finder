
DROP TRIGGER IF EXISTS prevent_self_admin_promotion_trg ON public.profiles;
CREATE TRIGGER prevent_self_admin_promotion_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_admin_promotion();

DROP POLICY IF EXISTS "Insert own entry" ON public.gym_challenge_entries;
CREATE POLICY "Insert own entry"
ON public.gym_challenge_entries
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.gym_challenges c
    WHERE c.id = gym_challenge_entries.challenge_id
      AND c.gym_id = public.current_user_gym()
  )
);

CREATE POLICY "Requester or checkin owner deletes request"
ON public.join_requests
FOR DELETE TO authenticated
USING (
  requester_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.checkins c
    WHERE c.id = join_requests.checkin_id AND c.user_id = auth.uid()
  )
);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_self_admin_promotion() FROM authenticated, anon, public;
