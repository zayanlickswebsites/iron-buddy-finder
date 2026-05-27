-- Fix infinite recursion: the "Users view profiles at same gym" policy
-- queries the profiles table from within a profiles policy. Replace it
-- with one that uses the existing SECURITY DEFINER current_user_gym() function.
DROP POLICY IF EXISTS "Users view profiles at same gym" ON public.profiles;

CREATE POLICY "Users view profiles at same gym"
ON public.profiles
FOR SELECT
TO authenticated
USING (gym_id IS NOT NULL AND gym_id = public.current_user_gym());