import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Link2, Play, Loader2, ArrowRight, FileText, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeUrl } from "@/lib/extract.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const placeholderPalette = (seed: string) => {
  const colors = ["bg-primary", "bg-mint", "bg-highlight", "bg-destructive", "bg-accent"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return [
    colors[Math.abs(hash) % colors.length],
    colors[Math.abs(hash >> 2) % colors.length],
    colors[Math.abs(hash >> 4) % colors.length],
  ];
};

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
        <div className="space-y-10">
          {/* Welcome header */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-soft backdrop-blur-sm">
            <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-mint to-highlight" />
            <div className="relative flex flex-col gap-2">
              <h1 className="text-4xl font-semibold tracking-tight">
                Hey {profile?.nickname ?? "there"}&nbsp;!
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Ready to capture a brand? Drop a URL below and turn any site into a clean, downloadable visual identity guide.
              </p>
            </div>
          </div>

          {/* Extraction command card */}
          <Card className="relative overflow-hidden border-primary/20 shadow-lift">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-mint to-highlight" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="size-5 text-primary" />
                Clone a website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary/70" />
                <Input
                  value={url}
                  maxLength={2048}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !busy && start()}
                  placeholder="https://stripe.com"
                  className="h-16 rounded-xl border-primary/20 bg-background pl-12 text-base shadow-inner transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <Button size="lg" className="h-14 w-full text-base shadow-soft transition-all hover:shadow-lift active:scale-[0.99]" disabled={busy} onClick={start}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> Extracting the design system…
                  </>
                ) : (
                  <>
                    <Play className="size-5" /> Start the process
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent work grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent work</h2>
              <span className="text-xs font-medium text-muted-foreground">
                {rows.length} project{rows.length === 1 ? "" : "s"}
              </span>
            </div>

            {rows.length === 0 ? (
              <Card className="border-dashed bg-card/60 py-12 shadow-soft">
                <CardContent className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <FileText className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No extractions yet.</p>
                  <p className="max-w-xs text-xs text-muted-foreground">Paste a URL above to create your first visual identity guide.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((r) => {
                  const palette = placeholderPalette(r.id);
                  return (
                    <Link
                      key={r.id}
                      to="/workspace/$id"
                      params={{ id: r.id }}
                      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Globe className="size-5" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Open <ArrowRight className="size-3.5" />
                        </span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{r.title || r.url}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.url}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <div className="flex gap-1.5">
                          {palette.map((c, i) => (
                            <span key={i} className={`block size-5 rounded-full ${c} ring-2 ring-card`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {format(new Date(r.created_at), "d MMM yyyy")}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
