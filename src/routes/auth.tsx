import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Home } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { StudyBackdrop } from "@/components/StudyBackdrop";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CCSCloner" },
      { name: "description", content: "Log in or create your CCSCloner account to start extracting website design systems." },
      { property: "og:title", content: "Sign in — CCSCloner" },
      { property: "og:description", content: "Log in or create your CCSCloner account." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const routeAfterAuth = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", userId)
      .maybeSingle();
    void navigate({ to: data?.onboarded ? "/workspace" : "/onboarding" });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void routeAfterAuth(data.session.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          throw new Error(
            error.message.toLowerCase().includes("invalid login")
              ? "Wrong email or password. If you're new, use the Sign up tab."
              : error.message,
          );
        }
        toast.success("Welcome back!");
        await routeAfterAuth(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) {
          throw new Error(
            error.message.toLowerCase().includes("already registered")
              ? "That email already has an account. Use the Log in tab."
              : error.message,
          );
        }
        // Auto-confirm is on, so a session is returned immediately. If it isn't
        // (e.g. confirmation required), sign in explicitly.
        let userId = data.session?.user.id ?? null;
        if (!userId) {
          const { data: signedIn, error: signInError } =
            await supabase.auth.signInWithPassword(parsed.data);
          if (signInError) throw signInError;
          userId = signedIn.user.id;
        }
        toast.success("Account created!");
        await routeAfterAuth(userId);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    setBusy(false);
    if (data.user) await routeAfterAuth(data.user.id);
  };


  return (
    <div className="relative min-h-screen">
      <StudyBackdrop />
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/">
          <Logo size="sm" />
        </Link>

        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <Home /> Home
          </Link>
        </Button>
      </header>

      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10">
        <Card className="w-full shadow-lift">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Log in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    maxLength={255}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    maxLength={72}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <TabsContent value="signin" className="m-0">
                  <Button className="w-full" disabled={busy} onClick={() => submit("signin")}>
                    {busy ? "Please wait…" : "Log in"}
                  </Button>
                </TabsContent>
                <TabsContent value="signup" className="m-0">
                  <Button className="w-full" disabled={busy} onClick={() => submit("signup")}>
                    {busy ? "Please wait…" : "Create account"}
                  </Button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    No email confirmation needed — you'll go straight in.
                  </p>

                </TabsContent>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
                </div>

                <Button variant="outline" className="w-full" disabled={busy} onClick={google}>
                  Continue with Google
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
