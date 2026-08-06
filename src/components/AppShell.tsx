import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, UserRound, Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StudyBackdrop } from "@/components/StudyBackdrop";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarSignedUrl, fetchProfile, type Profile } from "@/hooks/useAuth";

export function useProfileState() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const p = await fetchProfile(data.user.id);
    setProfile(p);
    setAvatar(await avatarSignedUrl(p?.avatar_url ?? null));
    setLoading(false);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { profile, avatar, loading, reload };
}

export function AppShell({
  children,
  requireOnboarding = true,
}: {
  children: (ctx: { profile: Profile | null; avatar: string | null; reload: () => Promise<void> }) => ReactNode;
  requireOnboarding?: boolean;
}) {
  const { profile, avatar, loading, reload } = useProfileState();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && requireOnboarding && profile && !profile.onboarded) {
      void navigate({ to: "/onboarding" });
    }
  }, [loading, requireOnboarding, profile, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  const initials = (profile?.nickname ?? profile?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="relative min-h-screen">
      <StudyBackdrop />
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center">
            <Logo size="sm" />
          </Link>


          <nav className="flex items-center gap-1">
            <Button asChild variant={pathname === "/" ? "secondary" : "ghost"} size="sm">
              <Link to="/">
                <Home /> Home
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname.startsWith("/workspace") ? "secondary" : "ghost"}
              size="sm"
            >
              <Link to="/workspace">
                <LayoutDashboard /> Workspace
              </Link>
            </Button>
            <Button asChild variant={pathname === "/profile" ? "secondary" : "ghost"} size="sm">
              <Link to="/profile">
                <UserRound /> Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
            <Avatar className="ml-1 size-9 border border-border">
              {avatar ? <AvatarImage src={avatar} alt="Your profile picture" /> : null}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        ) : (
          children({ profile, avatar, reload })
        )}
      </main>
    </div>
  );
}
