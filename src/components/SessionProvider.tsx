import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { avatarSignedUrl, fetchProfile, type Profile } from "@/hooks/useAuth";

/**
 * Single source of truth for "who is signed in".
 *
 * Why this exists: previously every page created its own local auth state and
 * fetched the user on mount. Public pages (home, features) had no auth state at
 * all, so navigating profile -> home looked like a logout even though the
 * Supabase session was still valid in storage. Route changes also remounted
 * those local states, causing flicker and repeated profile fetches.
 *
 * The session itself is persisted by the Supabase client (auth storage with
 * persistSession + autoRefreshToken). This provider mounts once at the router
 * root, hydrates from that persisted session on every page load (including hard
 * refresh, back/forward and direct URL access), and then keeps itself in sync
 * through a single onAuthStateChange subscription — no polling, no re-fetch per
 * route, no re-authentication prompt while a valid session exists.
 */

type SessionState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  avatar: string | null;
  /** True until the persisted session has been read at least once. */
  loading: boolean;
  isAuthenticated: boolean;
  /** Re-read the profile row (after onboarding / profile edits). */
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Guards against loading a profile for a user who already signed out.
  const currentUserId = useRef<string | null>(null);
  // Distinguishes a user-initiated sign out from an expired/revoked session.
  const intentionalSignOut = useRef(false);

  const loadProfile = useCallback(async (userId: string | null) => {
    currentUserId.current = userId;
    if (!userId) {
      setProfile(null);
      setAvatar(null);
      return;
    }
    try {
      const p = await fetchProfile(userId);
      if (currentUserId.current !== userId) return; // stale response, ignore
      setProfile(p);
      setAvatar(await avatarSignedUrl(p?.avatar_url ?? null));
    } catch {
      if (currentUserId.current !== userId) return;
      setProfile(null);
      setAvatar(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // 1) Subscribe FIRST so no auth event fired during hydration is missed.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);

      // TOKEN_REFRESHED / INITIAL_SESSION keep the same user: no profile refetch.
      if (event === "SIGNED_OUT") {
        // Only warn when the session ended on its own (expired / revoked
        // refresh token) — an intentional "Sign out" needs no error.
        if (currentUserId.current && !intentionalSignOut.current) {
          toast.error("Your session expired. Please sign in again.");
        }
        intentionalSignOut.current = false;
        void loadProfile(null);
      } else if (next?.user && next.user.id !== currentUserId.current) {
        void loadProfile(next.user.id);
      }
    });

    // 2) Hydrate from persisted storage for this page load.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      if (data.session?.user && data.session.user.id !== currentUserId.current) {
        void loadProfile(data.session.user.id);
      }
    });

    // 3) Bring a backgrounded/bfcache-restored tab back in sync. Browsers can
    //    serve a cached page without re-running effects, so we re-check the
    //    session (and let Supabase refresh an expired token) on return.
    const revalidate = () => {
      if (document.visibilityState !== "visible") return;
      void supabase.auth.getSession().then(({ data }) => {
        if (active) setSession(data.session);
      });
    };
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("pageshow", revalidate);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("pageshow", revalidate);
    };
  }, [loadProfile]);

  const reload = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    currentUserId.current = null;
    await loadProfile(data.user?.id ?? null);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    intentionalSignOut.current = true;
    await supabase.auth.signOut();
    setSession(null);
    await loadProfile(null);
  }, [loadProfile]);

  const value = useMemo<SessionState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      avatar,
      loading,
      isAuthenticated: !!session?.user,
      reload,
      signOut,
    }),
    [session, profile, avatar, loading, reload, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Safe fallback used when a component renders outside the provider — e.g. the
 * router's error / not-found layouts, which mount above <SessionProvider>.
 * Returning a signed-out state keeps those screens rendering instead of
 * crashing the page with a blank screen.
 */
const SIGNED_OUT: SessionState = {
  session: null,
  user: null,
  profile: null,
  avatar: null,
  loading: false,
  isAuthenticated: false,
  reload: async () => {},
  signOut: async () => {},
};

export function useSession(): SessionState {
  return useContext(SessionContext) ?? SIGNED_OUT;
}
