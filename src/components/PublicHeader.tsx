import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function PublicHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const navItems = [
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
          <Button asChild size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
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
              <Button asChild size="lg" className="mt-2 w-full max-w-xs" onClick={() => setOpen(false)}>
                <Link to="/auth">Get started</Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
