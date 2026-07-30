import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  nickname: string | null;
  username: string | null;
  email: string | null;
  occupation: string | null;
  organization: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  onboarded: boolean;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function avatarSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
