import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { History, MapPin, Building2, AtSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/ProfileForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — CCSCloner" },
      { name: "description", content: "View and edit your CCSCloner profile and browse your extraction history." },
      { property: "og:title", content: "Your profile — CCSCloner" },
      { property: "og:description", content: "Your CCSCloner profile and past work." },
    ],
  }),
  component: ProfilePage,
});

type HistoryRow = { id: string; url: string; title: string | null; created_at: string };

function ProfilePage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    void supabase
      .from("extractions")
      .select("id,url,title,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as HistoryRow[]) ?? []));
  }, []);

  return (
    <AppShell>
      {({ profile, avatar, reload }) => (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold">
              {profile?.nickname ? `${profile.nickname}'s profile` : "Your profile"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {profile?.username ? (
                <Badge variant="secondary">
                  <AtSign className="size-3" /> {profile.username}
                </Badge>
              ) : null}
              {profile?.occupation ? <Badge variant="secondary">{profile.occupation}</Badge> : null}
              {profile?.organization ? (
                <Badge variant="secondary">
                  <Building2 className="size-3" /> {profile.organization}
                </Badge>
              ) : null}
              {profile?.city ? (
                <Badge variant="secondary">
                  <MapPin className="size-3" /> {profile.city}
                  {profile.country ? `, ${profile.country}` : ""}
                </Badge>
              ) : null}
            </div>
          </div>

          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Work history</TabsTrigger>
              <TabsTrigger value="edit">Edit details</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="size-4" /> Previous extractions
                  </CardTitle>
                  <CardDescription>Every guide you have generated, newest first.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nothing yet — head to the workspace and paste your first URL.
                    </p>
                  ) : (
                    rows.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.title || r.url}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.url}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(new Date(r.created_at), "d MMM yyyy, HH:mm")}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/workspace/$id" params={{ id: r.id }}>
                            Open guide
                          </Link>
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">Account details</CardTitle>
                  <CardDescription>Update anything except your sign-in email.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm
                    profile={profile}
                    avatar={avatar}
                    submitLabel="Save changes"
                    onSaved={reload}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AppShell>
  );
}
