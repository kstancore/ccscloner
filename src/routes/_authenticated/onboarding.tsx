import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/ProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Create your account details — CCSCloner" },
      { name: "description", content: "Tell CCSCloner your nickname, role and location to finish setting up your account." },
      { property: "og:title", content: "Create your account details — CCSCloner" },
      { property: "og:description", content: "Finish setting up your CCSCloner account." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();

  return (
    <AppShell requireOnboarding={false}>
      {({ profile, avatar, reload }) => (
        <Card className="mx-auto max-w-3xl shadow-lift">
          <CardHeader>
            <CardTitle>Let's set up your account</CardTitle>
            <CardDescription>
              A few details so we can personalise your workspace. You can change any of this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              profile={profile}
              avatar={avatar}
              submitLabel="Create my account"
              onSaved={async () => {
                await reload();
                void navigate({ to: "/workspace" });
              }}
            />
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
