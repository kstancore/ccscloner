import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, UserRound, Home, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StudyBackdrop } from "@/components/StudyBackdrop";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/components/SessionProvider";
import type { Profile } from "@/hooks/useAuth";

export function AppShell({
  children,
  requireOnboarding = true,
}: {
  children: (ctx: { profile: Profile | null; avatar: string | null; reload: () => Promise<void> }) => ReactNode;
  requireOnboarding?: boolean;
}) {
  // Reads the shared session instead of fetching the user again on every page.
  const { profile, avatar, loading, reload, signOut: endSession } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && requireOnboarding && profile && !profile.onboarded) {
      void navigate({ to: "/onboarding" });
    }
  }, [loading, requireOnboarding, profile, navigate]);

  const signOut = async () => {
    await endSession();
    void navigate({ to: "/", replace: true });
  };

  const initials = (profile?.nickname ?? profile?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="relative min-h-screen">
      <StudyBackdrop />
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Logo size="sm" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <Button asChild variant={pathname === "/" ? "secondary" : "ghost"} size="sm">
              <Link to="/">
                <Home className="size-4" /> Home
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname.startsWith("/workspace") ? "secondary" : "ghost"}
              size="sm"
            >
              <Link to="/workspace">
                <LayoutDashboard className="size-4" /> Workspace
              </Link>
            </Button>
            <Button asChild variant={pathname === "/profile" ? "secondary" : "ghost"} size="sm">
              <Link to="/profile">
                <UserRound className="size-4" /> Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
            <Avatar className="ml-1 size-9 border border-border">
              {avatar ? <AvatarImage src={avatar} alt="Your profile picture" /> : null}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </nav>

          {/* Mobile nav */}
          <div className="flex items-center gap-1 md:hidden">
            <Button
              asChild
              variant={pathname === "/" ? "secondary" : "ghost"}
              size="icon"
              className="size-9"
              aria-label="Home"
            >
              <Link to="/">
                <Home className="size-5" />
              </Link>
            </Button>

            <MobileNav pathname={pathname} avatar={avatar} initials={initials} signOut={signOut} />
          </div>
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

function MobileNav({
  pathname,
  avatar,
  initials,
  signOut,
}: {
  pathname: string;
  avatar: string | null;
  initials: string;
  signOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const items = [
    { to: "/workspace", label: "Workspace", icon: LayoutDashboard, active: pathname.startsWith("/workspace") },
    { to: "/profile", label: "Profile", icon: UserRound, active: pathname === "/profile" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="flex flex-col items-center gap-4 pt-12">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 size-9"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-5" />
        </Button>

        <Avatar className="size-12 border border-border">
          {avatar ? <AvatarImage src={avatar} alt="Your profile picture" /> : null}
          <AvatarFallback className="bg-secondary text-lg text-secondary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Home className="size-5" /> Home
        </Link>

        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 text-lg font-semibold ${item.active ? "text-primary" : ""}`}
            >
              <Icon className="size-5" /> {item.label}
            </Link>
          );
        })}

        <Button
          variant="ghost"
          className="mt-2 w-full max-w-xs justify-center gap-2 text-lg font-semibold"
          onClick={() => {
            setOpen(false);
            void signOut();
          }}
        >
          <LogOut className="size-5" /> Sign out
        </Button>
      </SheetContent>
    </Sheet>
  );
}

