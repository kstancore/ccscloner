import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SiteReport } from "@/lib/extract.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None detected.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Badge key={i} variant="secondary" className="font-mono text-xs font-normal">
          {i}
        </Badge>
      ))}
    </div>
  );
}

export function ReportView({ report }: { report: SiteReport }) {
  const colorData = useMemo(
    () => report.colors.filter((c) => c.value.startsWith("#")).slice(0, 10),
    [report.colors],
  );
  const elementData = useMemo(() => report.elementCounts.slice(0, 10), [report.elementCounts]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        title="Colour palette"
        description="Ranked by how often each value appears in the stylesheets."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {report.colors.slice(0, 12).map((c) => (
            <div key={c.value} className="rounded-xl border border-border overflow-hidden">
              <div className="h-14 w-full" style={{ background: c.value }} />
              <div className="p-2">
                <p className="font-mono text-xs">{c.value}</p>
                <p className="text-[11px] text-muted-foreground">{c.count}×</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colour distribution" description="Usage frequency across the page's CSS.">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colorData} layout="vertical" margin={{ left: 12, right: 12 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="value"
                type="category"
                width={82}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="count" radius={4}>
                {colorData.map((c) => (
                  <Cell key={c.value} fill={c.value} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Typography" description="Families, scale and weights found in the CSS.">
        <div className="space-y-4">
          <div className="space-y-2">
            {report.fonts.slice(0, 6).map((f) => (
              <p key={f} className="truncate text-lg" style={{ fontFamily: f }}>
                {f}
              </p>
            ))}
            {report.fonts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No font families detected.</p>
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Type scale
            </p>
            <Chips items={report.fontSizes} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Weights
            </p>
            <Chips items={report.fontWeights} />
          </div>
        </div>
      </Section>

      <Section title="Spacing & shape" description="Rhythm, corner radii and depth.">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Spacing values
            </p>
            <Chips items={report.spacing.slice(0, 16)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Corner radii
            </p>
            <Chips items={report.radii} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shadows
            </p>
            <Chips items={report.shadows.slice(0, 5)} />
          </div>
        </div>
      </Section>

      <Section title="Structure" description="Element composition of the page.">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={elementData} margin={{ left: 0, right: 8 }}>
              <XAxis dataKey="tag" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="count" radius={4} fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Visual elements" description="Images referenced by the page.">
        {report.images.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images detected.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {report.images.slice(0, 9).map((img) => (
              <img
                key={img.src}
                src={img.src}
                alt={img.alt || "Visual element from the analysed page"}
                loading="lazy"
                className="h-24 w-full rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Design tokens in CSS" description="Custom properties declared on the page.">
        {report.cssVariables.length === 0 ? (
          <p className="text-sm text-muted-foreground">No CSS variables found.</p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-auto font-mono text-xs">
            {report.cssVariables.map((v) => (
              <p key={v.name} className="truncate">
                <span className="text-primary">{v.name}</span>: {v.value}
              </p>
            ))}
          </div>
        )}
      </Section>

      <Section title="Code & technology" description="Stylesheets, scripts and detected stack.">
        <div className="space-y-4 text-sm">
          <Chips items={report.frameworks} />
          <p className="text-muted-foreground">
            {report.stylesheets.length} stylesheet(s) · {report.scripts} script tag(s) ·{" "}
            {(report.stats.htmlBytes / 1024).toFixed(1)} KB HTML
          </p>
          <pre className="max-h-56 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-relaxed">
            {report.cssSnippet.slice(0, 1500)}
          </pre>
        </div>
      </Section>
    </div>
  );
}
