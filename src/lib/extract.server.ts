// Pure server-side helpers for analysing a web page's visual identity.

import type { ColorHit, SiteReport } from "./report-types";
import { buildReplicationSpec } from "./replication-spec.server";

export type { ColorHit, SiteReport };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

function absolute(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function rgbToHex(input: string): string | null {
  const m = input.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map((n) => Math.max(0, Math.min(255, Math.round(Number(n)))));
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function normalizeHex(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  return "#" + h.toUpperCase();
}

function tally(values: string[], limit: number): ColorHit[] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function uniq(values: string[], limit: number): string[] {
  return [...new Set(values)].slice(0, limit);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchText(url: string, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,text/css,*/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function buildSiteReport(rawUrl: string): Promise<SiteReport> {
  const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const parsedUrl = new URL(candidate);
  if (!/^https?:$/.test(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    throw new Error("Enter a public HTTP or HTTPS website URL.");
  }
  if (
    /^(?:localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|169\.254(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[?::1\]?)$/i.test(
      parsedUrl.hostname,
    )
  ) {
    throw new Error("Private and local network addresses cannot be analysed.");
  }
  const url = parsedUrl.toString();
  const html = await fetchText(url);

  // Stylesheets (external + inline)
  const linkHrefs = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)]
    .map((m) => m[0].match(/href=["']([^"']+)["']/i)?.[1])
    .filter(Boolean)
    .map((h) => absolute(h as string, url))
    .slice(0, 6);

  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1])
    .join("\n");

  const externalCss = (
    await Promise.all(
      linkHrefs.map(async (href) => {
        try {
          return await fetchText(href, 9000);
        } catch {
          return "";
        }
      }),
    )
  ).join("\n");

  const styleAttrs = [...html.matchAll(/style=["']([^"']+)["']/gi)].map((m) => m[1]).join(";");
  const css = `${inlineCss}\n${externalCss}\n${styleAttrs}`;

  // Colors
  const hexes = [...css.matchAll(/#([0-9a-f]{3,8})\b/gi)].map((m) => normalizeHex(m[1]));
  const rgbs = [...css.matchAll(/rgba?\([^)]+\)/gi)]
    .map((m) => rgbToHex(m[0]))
    .filter(Boolean) as string[];
  const oklchs = [...css.matchAll(/oklch\([^)]+\)/gi)].map((m) => m[0].replace(/\s+/g, " "));
  const themeColor = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const colorPool = [...hexes, ...rgbs, ...(themeColor ? [themeColor.toUpperCase()] : [])];
  const colors = tally(colorPool, 24);
  for (const ok of uniq(oklchs, 6)) colors.push({ value: ok, count: 1 });

  // Typography
  const families = [...css.matchAll(/font-family\s*:\s*([^;}"']+)/gi)]
    .map((m) => m[1].trim().replace(/["']/g, ""))
    .filter((f) => f.length < 120);
  const googleFonts = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"']+)/gi)]
    .flatMap((m) => [...m[1].matchAll(/family=([^&:]+)/gi)].map((f) => decodeURIComponent(f[1].replace(/\+/g, " "))));
  const fonts = uniq([...googleFonts, ...families], 12);

  const fontSizes = uniq(
    [...css.matchAll(/font-size\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim()),
    18,
  );
  const fontWeights = uniq(
    [...css.matchAll(/font-weight\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim()),
    10,
  );

  // Spacing / shape / depth
  const spacing = uniq(
    [...css.matchAll(/(?:margin|padding|gap)(?:-[a-z]+)?\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim()),
    24,
  );
  const radii = uniq(
    [...css.matchAll(/border-radius\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim()),
    12,
  );
  const shadows = uniq(
    [...css.matchAll(/box-shadow\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim()),
    10,
  );
  const cssVariables = [...css.matchAll(/(--[a-z0-9-_]+)\s*:\s*([^;}]+)/gi)]
    .map((m) => ({ name: m[1], value: m[2].trim() }))
    .filter((v, i, arr) => arr.findIndex((x) => x.name === v.name) === i)
    .slice(0, 40);

  // Content and structure
  const images = [...html.matchAll(/<img[^>]*>/gi)]
    .map((m) => ({
      src: absolute(m[0].match(/src=["']([^"']+)["']/i)?.[1] ?? "", url),
      alt: m[0].match(/alt=["']([^"']*)["']/i)?.[1] ?? "",
    }))
    .filter((i) => i.src)
    .slice(0, 16);

  const tagCounts = new Map<string, number>();
  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)\b/gi)) {
    const tag = m[1].toLowerCase();
    if (["script", "style", "meta", "link", "br", "path", "html", "head", "body"].includes(tag)) continue;
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const elementCounts = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 14);

  const headings = [...html.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => ({ level: m[1].toLowerCase(), text: stripTags(m[2]).slice(0, 120) }))
    .filter((h) => h.text)
    .slice(0, 14);

  const buttonsSample = uniq(
    [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)]
      .map((m) => stripTags(m[1]))
      .filter(Boolean),
    10,
  );

  const frameworks: string[] = [];
  const lower = html.toLowerCase();
  const detect: [string, string][] = [
    ["tailwind", "Tailwind CSS"],
    ["bootstrap", "Bootstrap"],
    ["__next", "Next.js"],
    ["wp-content", "WordPress"],
    ["data-reactroot", "React"],
    ["react", "React"],
    ["vue", "Vue"],
    ["svelte", "Svelte"],
    ["shopify", "Shopify"],
    ["webflow", "Webflow"],
    ["squarespace", "Squarespace"],
    ["gsap", "GSAP"],
    ["framer", "Framer"],
  ];
  for (const [needle, label] of detect) {
    if (lower.includes(needle) && !frameworks.includes(label)) frameworks.push(label);
  }

  const favicon = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i)?.[0];
  const faviconHref = favicon?.match(/href=["']([^"']+)["']/i)?.[1];

  const report: SiteReport = {
    url,
    title: stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || new URL(url).hostname,
    description:
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
      "",
    favicon: faviconHref ? absolute(faviconHref, url) : null,
    colors,
    fonts,
    fontSizes,
    fontWeights,
    spacing,
    radii,
    shadows,
    cssVariables,
    images,
    elementCounts,
    stylesheets: linkHrefs,
    scripts: [...html.matchAll(/<script\b/gi)].length,
    frameworks,
    headings,
    buttonsSample,
    cssSnippet: css.replace(/\s+/g, " ").trim().slice(0, 4000),
    htmlSnippet: html.slice(0, 3000),
    stats: {
      htmlBytes: html.length,
      cssBytes: css.length,
      imageCount: [...html.matchAll(/<img\b/gi)].length,
      linkCount: [...html.matchAll(/<a\b/gi)].length,
    },
  };

  report.specification = buildReplicationSpec({ html, css, url, colors });
  return report;
}

export function buildDocumentation(report: SiteReport): string {
  const line = (s = "") => s;
  const list = (items: string[]) => (items.length ? items.map((i) => `- ${i}`).join("\n") : "- (none detected)");
  const spec = report.specification;
  const evidence = (items: { value: string; context?: string; count?: number }[] | undefined) =>
    list(
      (items ?? []).map(
        (item) => `${item.value}${item.count && item.count > 1 ? ` — ${item.count} occurrences` : ""}${item.context ? ` (${item.context})` : ""}`,
      ),
    );
  const roles = () =>
    list(
      (spec?.typography.roles ?? []).map((role) =>
        [
          `${role.role} — selector \`${role.selector}\``,
          role.family ? `family ${role.family}` : null,
          role.size ? `size ${role.size}` : null,
          role.weight ? `weight ${role.weight}` : null,
          role.style ? `style ${role.style}` : null,
          role.lineHeight ? `line-height ${role.lineHeight}` : null,
          role.letterSpacing ? `letter-spacing ${role.letterSpacing}` : null,
          role.transform ? `transform ${role.transform}` : null,
        ]
          .filter(Boolean)
          .join("; "),
      ),
    );

  const parts: (string | null)[] = [
    `# Website Replication Specification — ${report.title}`,
    ``,
    `**Source:** ${report.url}`,
    report.description ? `**Summary:** ${report.description}` : null,
    ``,
    `## 1. Capture summary`,
    `This handoff documents the source evidence available for rebuilding the analysed page. Values are extracted from the page HTML and its accessible stylesheets; unavailable evidence is marked rather than estimated.`,
    ``,
    `- HTML weight: ${(report.stats.htmlBytes / 1024).toFixed(1)} KB`,
    `- CSS analysed: ${(report.stats.cssBytes / 1024).toFixed(1)} KB across ${report.stylesheets.length} stylesheet(s)`,
    `- Images: ${report.stats.imageCount} · Links: ${report.stats.linkCount} · Scripts: ${report.scripts}`,
    report.frameworks.length ? `- Detected technology: ${report.frameworks.join(", ")}` : null,
    spec ? `- Capture method: ${spec.capture.method}` : null,
    spec ? `- Captured: ${spec.capture.capturedAt}` : null,
    spec?.capture.limitations.length ? `\n**Capture limitations**\n${list(spec.capture.limitations)}` : null,
    ``,
    `## 2. Typography`,
    `### Text roles and selectors`,
    roles(),
    ``,
    `### Font families`,
    evidence(spec?.typography.families ?? report.fonts.map((value) => ({ value }))),
    ``,
    `### Font sizes`,
    evidence(spec?.typography.sizes ?? report.fontSizes.map((value) => ({ value }))),
    ``,
    `### Weights and styles`,
    evidence(spec?.typography.weights ?? report.fontWeights.map((value) => ({ value }))),
    ``,
    `### Line heights`,
    evidence(spec?.typography.lineHeights),
    ``,
    `### Letter spacing and transformations`,
    evidence([...(spec?.typography.letterSpacings ?? []), ...(spec?.typography.transforms ?? [])]),
    ``,
    `### Font loading`,
    list(spec?.typography.fontLoading ?? []),
    ``,
    `## 3. Colors`,
    `### Complete palette`,
    list(report.colors.map((color) => `${color.value} — ${color.count} occurrences`)),
    ``,
    `### Background and surface colors`,
    evidence(spec?.colors.byProperty.backgrounds),
    ``,
    `### Text colors`,
    evidence(spec?.colors.byProperty.text),
    ``,
    `### Border, shadow, and overlay values`,
    evidence([
      ...(spec?.colors.byProperty.borders ?? []),
      ...(spec?.colors.byProperty.shadows ?? []),
      ...(spec?.colors.byProperty.overlays ?? []),
    ]),
    ``,
    `### Theme variations`,
    list(spec?.colors.themeVariations ?? []),
    ``,
    `## 4. Spacing`,
    spec?.spacing.probableBaseUnit ? `- Probable base unit: ${spec.spacing.probableBaseUnit}` : `- Base unit: not reliably inferable`,
    evidence(spec?.spacing.values ?? report.spacing.map((value) => ({ value }))),
    ``,
    `### Page and container rules`,
    list(spec?.spacing.containerRules ?? []),
    ``,
    `## 5. Layout`,
    `### Display modes`,
    evidence(spec?.layout.displayModes),
    ``,
    `### Grid templates`,
    evidence(spec?.layout.gridTemplates),
    ``,
    `### Width and container constraints`,
    evidence(spec?.layout.containerWidths),
    ``,
    `### Positioning and layering`,
    evidence([...(spec?.layout.positions ?? []), ...(spec?.layout.zIndices ?? [])]),
    ``,
    `## 6. Components`,
    list(
      (spec?.components ?? []).map(
        (component) =>
          `${component.type} — ${component.count} found; variants: ${component.variants.join(", ") || "none named"}; states: ${component.states.join(", ") || "none detected"}; ${component.notes.join(" ")}`,
      ),
    ),
    ``,
    `## 7. Effects`,
    `### Shadows`,
    evidence(spec?.effects.shadows ?? report.shadows.map((value) => ({ value }))),
    ``,
    `### Gradients`,
    evidence(spec?.effects.gradients),
    ``,
    `### Filters and backdrop effects`,
    evidence(spec?.effects.filters),
    ``,
    `### Transitions and animations`,
    evidence([...(spec?.effects.transitions ?? []), ...(spec?.effects.animations ?? [])]),
    ``,
    `## 8. Assets`,
    list(
      (spec?.assets ?? report.images.map((image) => ({ type: "img", url: image.src, format: "unknown", alt: image.alt }))).map(
        (asset) =>
          `${asset.type}: ${asset.url} — ${asset.format}${asset.width || asset.height ? `; ${asset.width ?? "auto"} × ${asset.height ?? "auto"}` : ""}${asset.alt ? `; alt: “${asset.alt}”` : ""}${asset.loading ? `; loading: ${asset.loading}` : ""}`,
      ),
    ),
    ``,
    `## 9. Responsiveness`,
    `- Viewport declaration: ${spec?.responsiveness.viewportMeta ?? "not detected"}`,
    `- Breakpoints: ${spec?.responsiveness.breakpoints.join(", ") || "none detected"}`,
    list(
      (spec?.responsiveness.rules ?? []).map(
        (rule) => `${rule.query} — ${rule.ruleCount} rules; affects ${rule.affectedSelectors.join(", ") || "unresolved selectors"}`,
      ),
    ),
    ``,
    `## 10. Interaction`,
    list(
      Object.entries(spec?.interaction.pseudoStates ?? {}).flatMap(([state, selectors]) =>
        selectors.length ? [`${state}: ${selectors.join(", ")}`] : [],
      ),
    ),
    ``,
    `### Native and keyboard behavior`,
    list(spec?.interaction.nativeBehaviors ?? []),
    ``,
    `### Form validation evidence`,
    list(spec?.interaction.validation ?? []),
    ``,
    `## 11. Content structure`,
    `### Landmarks`,
    evidence(spec?.content.landmarks),
    ``,
    `### Heading outline`,
    list((spec?.content.headingOutline ?? report.headings).map((heading) => `${heading.level.toUpperCase()}: ${heading.text}`)),
    ``,
    `### Navigation`,
    list((spec?.content.navigation ?? []).map((item) => `${item.label} → ${item.href}`)),
    ``,
    `### Forms`,
    list((spec?.content.forms ?? []).map((form) => `${form.method} ${form.action} — fields: ${form.fields.join(", ") || "none named"}`)),
    ``,
    `### Footer`,
    list((spec?.content.footerLinks ?? []).map((item) => `${item.label} → ${item.href}`)),
    ``,
    `### Structured content`,
    list(spec?.content.structuredDataTypes ?? []),
    ``,
    `## 12. Design tokens found in CSS`,
    list(report.cssVariables.map((v) => `${v.name}: ${v.value}`)),
    ``,
    `## 13. Source composition and technology`,
    list(report.elementCounts.map((e) => `<${e.tag}> × ${e.count}`)),
    ``,
    report.frameworks.length ? `**Detected technology**\n${list(report.frameworks)}\n` : null,
    report.buttonsSample.length ? `**Button labels**\n${list(report.buttonsSample)}\n` : null,
    `## 14. Replication rules`,
    `- Recreate semantic roles and reusable component variants; do not copy isolated values without their selector context.`,
    `- Load detected fonts before tuning dimensions because font metrics affect wrapping and spacing.`,
    `- Implement the mobile baseline first, then apply each extracted media query in source order.`,
    `- Preserve landmark order, heading hierarchy, accessible labels, focus states, and validation behavior.`,
    `- Verify unavailable dynamic states manually in a browser before declaring pixel-level parity.`,
    ``,
    line(),
  ];

  return parts.filter((v): v is string => v !== null).join("\n");
}
