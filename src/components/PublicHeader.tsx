import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/components/SessionProvider";

export function PublicHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  // Public pages now read the same shared session as the signed-in pages, so
  // going profile -> home keeps showing the account instead of "Log in".
  const { isAuthenticated, loading, profile, avatar, signOut } = useSession();

  const initials = (profile?.nickname ?? profile?.email ?? "?").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    void navigate({ to: "/", replace: true });
  };

  const navItems = isAuthenticated
    ? [
        { to: "/features", label: "Features" },
        { to: "/workspace", label: "Workspace" },
        { to: "/profile", label: "Profile" },
      ]
    : [
        { to: "/features", label: "Features" },
        { to: "/auth", label: "Log in" },
      ];

  return (
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
          {navItems.map((item) => (
            <Button
              key={item.to}
              asChild
              variant={pathname === item.to ? "secondary" : "ghost"}
              size="sm"
            >
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}

          {loading ? (
            <div className="ml-1 size-9 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
              <Avatar className="ml-1 size-9 border border-border">
                {avatar ? <AvatarImage src={avatar} alt="Your profile picture" /> : null}
                <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          )}
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

              {isAuthenticated ? (
                <Avatar className="size-12 border border-border">
                  {avatar ? <AvatarImage src={avatar} alt="Your profile picture" /> : null}
                  <AvatarFallback className="bg-secondary text-lg text-secondary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : null}

              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Home className="size-5" /> Home
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="text-lg font-semibold"
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  className="mt-2 w-full max-w-xs justify-center gap-2 text-lg font-semibold"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-5" /> Sign out
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="mt-2 w-full max-w-xs"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/auth">Get started</Link>
                </Button>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
