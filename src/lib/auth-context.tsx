import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  training_style: string | null;
  gym_id: string | null;
  membership_id: string | null;
  is_verified: boolean;
  is_admin: boolean;
  avatar_url: string | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  profileLoaded: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string, email: string | null) => {
    setProfileLoaded(false);
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (data) {
      setProfile(data as Profile);
    } else {
      // Auto-create blank profile if missing (e.g. trigger didn't fire)
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: uid, email })
        .select("*")
        .maybeSingle();
      setProfile((created as Profile) ?? null);
    }
    setProfileLoaded(true);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id, s.user.email ?? null), 0);
      } else {
        setProfile(null);
        setProfileLoaded(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id, s.user.email ?? null).finally(() => setLoading(false));
      } else {
        setProfileLoaded(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id, session.user.email ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, profile, profileLoaded, loading, refreshProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
