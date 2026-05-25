
-- ENUMS
CREATE TYPE training_style AS ENUM ('Powerlifting','Bodybuilding','Cardio','CrossFit','General Fitness');
CREATE TYPE training_type AS ENUM ('Chest Day','Leg Day','Back & Biceps','Shoulders','Arms','Cardio','Full Body','Other');
CREATE TYPE join_request_status AS ENUM ('pending','accepted','declined');
CREATE TYPE gym_challenge_type AS ENUM ('highest_bench_press','highest_squat','highest_deadlift','most_pullups','most_pushups','fastest_5km','longest_plank');
CREATE TYPE inter_competition_type AS ENUM ('total_bench_press','total_deadlift','total_checkins','most_pbs','total_pullups','highest_avg_bench');

-- GYMS
CREATE TABLE public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  chain text NOT NULL,
  suburb text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read gyms" ON public.gyms FOR SELECT TO authenticated USING (true);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  training_style training_style,
  gym_id uuid REFERENCES public.gyms(id),
  membership_id text,
  is_verified boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users view profiles at same gym" ON public.profiles FOR SELECT TO authenticated
  USING (gym_id IS NOT NULL AND gym_id = (SELECT gym_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: is current user verified at a given gym?
CREATE OR REPLACE FUNCTION public.is_verified_at_gym(_gym_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_verified = true AND gym_id = _gym_id
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_gym()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT gym_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- CHECKINS
CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  training_type training_type NOT NULL,
  is_open_to_join boolean NOT NULL DEFAULT false,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX checkins_gym_active_idx ON public.checkins(gym_id, is_active, checked_in_at DESC);
CREATE INDEX checkins_user_active_idx ON public.checkins(user_id, is_active);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View checkins at same gym" ON public.checkins FOR SELECT TO authenticated
  USING (gym_id = public.current_user_gym());
CREATE POLICY "Insert own checkin at own gym" ON public.checkins FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND gym_id = public.current_user_gym());
CREATE POLICY "Update own checkin" ON public.checkins FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- JOIN REQUESTS
CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id uuid NOT NULL REFERENCES public.checkins(id) ON DELETE CASCADE,
  status join_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, checkin_id)
);
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester views own requests" ON public.join_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid());
CREATE POLICY "Checkin owner views requests" ON public.join_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.checkins c WHERE c.id = checkin_id AND c.user_id = auth.uid()));
CREATE POLICY "Insert join request" ON public.join_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Checkin owner updates request" ON public.join_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.checkins c WHERE c.id = checkin_id AND c.user_id = auth.uid()));

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  max_attendees int,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View events at same gym" ON public.events FOR SELECT TO authenticated
  USING (gym_id = public.current_user_gym());
CREATE POLICY "Admins create events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_admin() AND gym_id = public.current_user_gym());

-- RSVPS
CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View rsvps for events at same gym" ON public.rsvps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.gym_id = public.current_user_gym()));
CREATE POLICY "Insert own rsvp" ON public.rsvps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own rsvp" ON public.rsvps FOR DELETE TO authenticated USING (user_id = auth.uid());

-- GYM CHALLENGES
CREATE TABLE public.gym_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  title text NOT NULL,
  challenge_type gym_challenge_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View challenges at same gym" ON public.gym_challenges FOR SELECT TO authenticated
  USING (gym_id = public.current_user_gym());
CREATE POLICY "Admins create challenges" ON public.gym_challenges FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_admin() AND gym_id = public.current_user_gym());

CREATE TABLE public.gym_challenge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.gym_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result numeric NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);
ALTER TABLE public.gym_challenge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View entries for visible challenges" ON public.gym_challenge_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gym_challenges c WHERE c.id = challenge_id AND c.gym_id = public.current_user_gym()));
CREATE POLICY "Insert own entry" ON public.gym_challenge_entries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own entry" ON public.gym_challenge_entries FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- INTER-GYM COMPETITIONS
CREATE TABLE public.inter_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  competition_type inter_competition_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inter_competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated views competitions" ON public.inter_competitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins create competitions" ON public.inter_competitions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE TABLE public.inter_competition_gyms (
  competition_id uuid NOT NULL REFERENCES public.inter_competitions(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  PRIMARY KEY (competition_id, gym_id)
);
ALTER TABLE public.inter_competition_gyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated views competition gyms" ON public.inter_competition_gyms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins assign gyms to competitions" ON public.inter_competition_gyms FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE TABLE public.inter_competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.inter_competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  result numeric NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, user_id)
);
ALTER TABLE public.inter_competition_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated views entries" ON public.inter_competition_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own competition entry" ON public.inter_competition_entries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND gym_id = public.current_user_gym());
CREATE POLICY "Update own competition entry" ON public.inter_competition_entries FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;
