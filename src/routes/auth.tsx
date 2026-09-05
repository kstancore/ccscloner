import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { PublicHeader } from "@/components/PublicHeader";
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
      {
        name: "description",
        content: "Log in or create your CCSCloner account to start extracting website design systems.",
      },
      { property: "og:title", content: "Sign in — CCSCloner" },
      { property: "og:description", content: "Log in or create your CCSCloner account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().toLowerCase().email({ message: "Enter a valid email address" }).max(255);
const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Enter your password" }).max(72),
});
const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const routeAfterAuth = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", userId)
        .maybeSingle();
      void navigate({ to: data?.onboarded ? "/workspace" : "/onboarding", replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" && session) void routeAfterAuth(session.user.id);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) void routeAfterAuth(data.session.user.id);
      else setCheckingSession(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [routeAfterAuth]);

  const signIn = async () => {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not confirmed")) {
        setPendingEmail(parsed.data.email);
        toast.error("Please confirm your email first — we can resend the link.");
        return;
      }
      toast.error(
        msg.includes("invalid login")
          ? "Wrong email or password. New here? Use the Sign up tab."
          : error.message,
      );
      return;
    }
    toast.success("Welcome back!");
    await routeAfterAuth(data.user.id);
  };

  const signUp = async () => {
    const parsed = signUpSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      toast.error(
        msg.includes("already registered") || msg.includes("already been registered")
          ? "That email already has an account. Use the Log in tab."
          : msg.includes("pwned") || msg.includes("compromised")
            ? "That password has appeared in a data breach. Please pick a different one."
            : error.message,
      );
      return;
    }
    if (data.session) {
      toast.success("Account created!");
      await routeAfterAuth(data.session.user.id);
      return;
    }
    setPendingEmail(parsed.data.email);
    setPassword("");
    toast.success("Check your inbox to confirm your email.");
  };

  const resend = async () => {
    if (!pendingEmail) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("rate")
          ? "Please wait a minute before asking for another email."
          : error.message,
      );
      return;
    }
    toast.success("Confirmation email sent again.");
  };

  const forgotPassword = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("Enter your email above first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent — check your email.");
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
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
      <PublicHeader />

      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-6 md:py-10">
        <Card className="w-full shadow-lift">
          {pendingEmail ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MailCheck className="size-5 text-primary" /> Confirm your email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <span className="font-medium text-foreground">{pendingEmail}</span>.
                  Click it and you'll be signed in automatically. It can take a minute to arrive — check
                  spam too.
                </p>
                <Button className="w-full" variant="outline" disabled={busy} onClick={resend}>
                  {busy ? "Sending…" : "Resend confirmation email"}
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    setPendingEmail(null);
                    setTab("signin");
                  }}
                >
                  Use a different email
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Welcome</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Log in</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>

                  <form
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (busy || checkingSession) return;
                      void (tab === "signin" ? signIn() : signUp());
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        maxLength={255}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {tab === "signin" && (
                          <button
                            type="button"
                            onClick={forgotPassword}
                            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete={tab === "signin" ? "current-password" : "new-password"}
                          value={password}
                          maxLength={72}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={tab === "signin" ? "Password" : "At least 8 characters"}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <TabsContent value="signin" className="m-0">
                      <Button type="submit" className="w-full" disabled={busy || checkingSession}>
                        {busy ? "Please wait…" : "Log in"}
                      </Button>
                    </TabsContent>
                    <TabsContent value="signup" className="m-0">
                      <Button type="submit" className="w-full" disabled={busy || checkingSession}>
                        {busy ? "Please wait…" : "Create account"}
                      </Button>
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        We'll email you a confirmation link to verify it's really you.
                      </p>
                    </TabsContent>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="h-px flex-1 bg-border" /> or{" "}
                      <span className="h-px flex-1 bg-border" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={busy}
                      onClick={google}
                    >
                      Continue with Google
                    </Button>
                  </form>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
