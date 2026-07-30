import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Link2, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeUrl } from "@/lib/extract.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/workspace/")({
  head: () => ({
    meta: [
      { title: "Workspace — CCSCloner" },
      { name: "description", content: "Paste a URL and extract its colours, typography, spacing and visual identity into an editable guide." },
      { property: "og:title", content: "Workspace — CCSCloner" },
      { property: "og:description", content: "Paste a URL and start an extraction." },
    ],
  }),
  component: Workspace,
});

type HistoryRow = { id: string; url: string; title: string | null; created_at: string };

function Workspace() {
  const navigate = useNavigate();
  const run = useServerFn(analyzeUrl);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<HistoryRow[]>([]);

  const loadHistory = () =>
    supabase
      .from("extractions")
      .select("id,url,title,created_at")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setRows((data as HistoryRow[]) ?? []));

  useEffect(() => {
    void loadHistory();
  }, []);

  const start = async () => {
    const value = url.trim();
    if (value.length < 4) return toast.error("Paste a website URL first");
    setBusy(true);
    try {
      const result = await run({ data: { url: value } });
      toast.success("Extraction complete");
      void navigate({ to: "/workspace/$id", params: { id: result.id } });
    } catch (e) {
      toast.error(
        e instanceof Error ? `Could not analyse that page: ${e.message}` : "Could not analyse that page",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      {({ profile }) => (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold">
              Hey {profile?.nickname ?? "there"} 👋
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste any public web page below and we'll document its entire visual identity.
            </p>
          </div>

          <Card className="shadow-lift">
            <CardHeader>
              <CardTitle className="text-base">New extraction</CardTitle>
              <CardDescription>Colours, typography, spacing, code, structure and guides.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={url}
                  maxLength={2048}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !busy && start()}
                  placeholder="https://stripe.com"
                  className="h-14 pl-10 text-base"
                />
              </div>
              <Button size="lg" className="w-full" disabled={busy} onClick={start}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> Extracting the design system…
                  </>
                ) : (
                  <>
                    <Play /> Start the process
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Recent work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No extractions yet.</p>
              ) : (
                rows.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.title || r.url}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.url} · {format(new Date(r.created_at), "d MMM yyyy")}
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
        </div>
      )}
    </AppShell>
  );
}
