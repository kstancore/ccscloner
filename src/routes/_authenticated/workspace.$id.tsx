import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileDown, FileText, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SiteReport } from "@/lib/extract.server";
import { downloadDocx, downloadPdf } from "@/lib/export-doc";
import { AppShell } from "@/components/AppShell";
import { ReportView } from "@/components/ReportView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/workspace/$id")({
  head: () => ({
    meta: [
      { title: "Visual identity guide — CCSCloner" },
      { name: "description", content: "Review, edit and download the extracted visual identity documentation for this page." },
      { property: "og:title", content: "Visual identity guide — CCSCloner" },
      { property: "og:description", content: "Edit and export your extracted design documentation." },
    ],
  }),
  component: GuidePage,
});

type Row = {
  id: string;
  url: string;
  title: string | null;
  documentation: string | null;
  data: SiteReport;
};

function GuidePage() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<Row | null>(null);
  const [doc, setDoc] = useState("");
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    void supabase
      .from("extractions")
      .select("id,url,title,documentation,data")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return setNotFound(true);
        const r = data as unknown as Row;
        setRow(r);
        setDoc(r.documentation ?? "");
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("extractions")
      .update({ documentation: doc })
      .eq("id", id);
    setSaving(false);
    if (error) toast.error("Could not save your edits");
    else toast.success("Documentation saved");
  };

  const title = row?.title || row?.url || "Visual identity guide";

  return (
    <AppShell>
      {() => (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
                <Link to="/workspace">
                  <ArrowLeft /> Back to workspace
                </Link>
              </Button>
              <h1 className="truncate text-3xl font-semibold">{title}</h1>
              {row ? (
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  {row.url} <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadPdf(title, doc)} disabled={!row}>
                <FileDown /> Download PDF
              </Button>
              <Button variant="outline" onClick={() => void downloadDocx(title, doc)} disabled={!row}>
                <FileText /> Download DOCX
              </Button>
              <Button onClick={save} disabled={!row || saving}>
                <Save /> {saving ? "Saving…" : "Save edits"}
              </Button>
            </div>
          </div>

          {notFound ? (
            <p className="text-sm text-muted-foreground">This guide could not be found.</p>
          ) : !row ? (
            <p className="text-sm text-muted-foreground">Loading your guide…</p>
          ) : (
            <Tabs defaultValue="visuals">
              <TabsList>
                <TabsTrigger value="visuals">Visual breakdown</TabsTrigger>
                <TabsTrigger value="doc">Documentation</TabsTrigger>
              </TabsList>

              <TabsContent value="visuals" className="mt-6">
                <ReportView report={row.data} />
              </TabsContent>

              <TabsContent value="doc" className="mt-6">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-base">Editable documentation</CardTitle>
                    <CardDescription>
                      Refine the wording, then export it as PDF or DOCX using the buttons above.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={doc}
                      onChange={(e) => setDoc(e.target.value)}
                      className="min-h-[70vh] font-mono text-xs leading-relaxed"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </AppShell>
  );
}
