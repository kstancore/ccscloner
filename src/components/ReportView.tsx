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
import type { SiteReport } from "@/lib/report-types";
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

      {report.specification ? <SpecSections report={report} /> : null}
    </div>
  );
}

function Evidence({ items }: { items?: { value: string; count?: number; context?: string }[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">Not detected.</p>;
  return (
    <ul className="max-h-56 space-y-1 overflow-auto font-mono text-xs">
      {items.slice(0, 30).map((i, idx) => (
        <li key={i.value + idx} className="break-words">
          {i.value}
          {i.count && i.count > 1 ? <span className="text-muted-foreground"> ×{i.count}</span> : null}
          {i.context ? <span className="text-muted-foreground"> — {i.context}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </p>
  );
}

function SpecSections({ report }: { report: SiteReport }) {
  const s = report.specification!;
  const pseudo = Object.entries(s.interaction.pseudoStates ?? {}).filter(([, v]) => v.length);
  return (
    <>
      <Section title="Capture summary" description={s.capture.method}>
        <p className="text-xs text-muted-foreground">Captured {new Date(s.capture.capturedAt).toLocaleString()}</p>
        {s.capture.limitations.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {s.capture.limitations.map((l) => <li key={l}>{l}</li>)}
          </ul>
        ) : null}
      </Section>

      <Section title="Text roles" description="Selectors with their type settings.">
        {s.typography.roles.length ? (
          <div className="max-h-72 space-y-2 overflow-auto">
            {s.typography.roles.map((r, i) => (
              <div key={r.selector + i} className="rounded-lg border border-border p-2 text-xs">
                <p className="font-medium">{r.role} <span className="font-mono text-muted-foreground">{r.selector}</span></p>
                <p className="font-mono text-muted-foreground">
                  {[r.family, r.size, r.weight, r.lineHeight && `lh ${r.lineHeight}`, r.letterSpacing && `ls ${r.letterSpacing}`, r.transform].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Not detected.</p>}
        <Label>Line heights</Label><Evidence items={s.typography.lineHeights} />
        <Label>Font loading</Label><Chips items={s.typography.fontLoading} />
      </Section>

      <Section title="Colours by use" description="Backgrounds, text, borders and overlays.">
        <Label>Backgrounds</Label><Evidence items={s.colors.byProperty.backgrounds} />
        <Label>Text</Label><Evidence items={s.colors.byProperty.text} />
        <Label>Borders</Label><Evidence items={s.colors.byProperty.borders} />
        <Label>Theme variations</Label><Chips items={s.colors.themeVariations} />
      </Section>

      <Section title="Spacing & layout" description={s.spacing.probableBaseUnit ? `Probable base unit: ${s.spacing.probableBaseUnit}` : "Base unit not inferable."}>
        <Label>Container rules</Label><Chips items={s.spacing.containerRules} />
        <Label>Display modes</Label><Evidence items={s.layout.displayModes} />
        <Label>Grid templates</Label><Evidence items={s.layout.gridTemplates} />
        <Label>Container widths</Label><Evidence items={s.layout.containerWidths} />
        <Label>Z-index layers</Label><Evidence items={s.layout.zIndices} />
      </Section>

      <Section title="Components" description="UI elements, variants and states.">
        {s.components.length ? (
          <div className="max-h-72 space-y-2 overflow-auto text-sm">
            {s.components.map((c) => (
              <div key={c.type} className="rounded-lg border border-border p-2">
                <p className="font-medium">{c.type} <span className="text-muted-foreground">×{c.count}</span></p>
                {c.variants.length ? <p className="text-xs text-muted-foreground">Variants: {c.variants.join(", ")}</p> : null}
                {c.states.length ? <p className="text-xs text-muted-foreground">States: {c.states.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Not detected.</p>}
      </Section>

      <Section title="Effects" description="Gradients, filters, transitions and animations.">
        <Label>Gradients</Label><Evidence items={s.effects.gradients} />
        <Label>Filters</Label><Evidence items={s.effects.filters} />
        <Label>Transitions</Label><Evidence items={s.effects.transitions} />
        <Label>Animations</Label><Evidence items={s.effects.animations} />
      </Section>

      <Section title="Assets" description="Logos, icons, images and media.">
        {s.assets.length ? (
          <ul className="max-h-72 space-y-1 overflow-auto text-xs">
            {s.assets.slice(0, 40).map((a, i) => (
              <li key={a.url + i} className="break-all">
                <Badge variant="outline" className="mr-2">{a.type}</Badge>
                <span className="font-mono">{a.format}</span> {a.url}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Not detected.</p>}
      </Section>

      <Section title="Responsiveness" description={s.responsiveness.viewportMeta ?? "No viewport tag detected."}>
        <Label>Breakpoints</Label><Chips items={s.responsiveness.breakpoints} />
        <Label>Media queries</Label>
        <ul className="max-h-56 space-y-1 overflow-auto font-mono text-xs">
          {s.responsiveness.rules.map((r) => (
            <li key={r.query}>{r.query} — {r.ruleCount} rules</li>
          ))}
        </ul>
      </Section>

      <Section title="Interaction" description="States, native behaviour and validation.">
        {pseudo.map(([state, sels]) => (
          <div key={state}><Label>{state}</Label><Chips items={sels.slice(0, 12)} /></div>
        ))}
        <Label>Native behaviour</Label><Chips items={s.interaction.nativeBehaviors} />
        <Label>Validation</Label><Chips items={s.interaction.validation} />
      </Section>

      <Section title="Content structure" description="Landmarks, headings, navigation and forms.">
        <Label>Landmarks</Label><Evidence items={s.content.landmarks} />
        <Label>Headings</Label>
        <ul className="max-h-48 space-y-1 overflow-auto text-sm">
          {s.content.headingOutline.map((h, i) => (
            <li key={i}><span className="font-mono text-xs text-muted-foreground">{h.level.toUpperCase()}</span> {h.text}</li>
          ))}
        </ul>
        <Label>Navigation</Label><Chips items={s.content.navigation.map((n) => n.label)} />
        <Label>Structured data</Label><Chips items={s.content.structuredDataTypes} />
      </Section>
    </>
  );
}
