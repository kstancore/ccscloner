// Pure server-side helpers for analysing a web page's visual identity.

import type { ColorHit, SiteReport } from "./report-types";

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
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
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

  return {
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
}

export function buildDocumentation(report: SiteReport): string {
  const line = (s = "") => s;
  const list = (items: string[]) => (items.length ? items.map((i) => `- ${i}`).join("\n") : "- (none detected)");

  const parts: (string | null)[] = [
    `# Visual Identity Guide — ${report.title}`,
    ``,
    `**Source:** ${report.url}`,
    report.description ? `**Summary:** ${report.description}` : null,
    ``,
    `## 1. Overview`,
    `This guide documents the visual identity of the analysed page: colour usage, typography, spacing rhythm, component shapes and structural composition. Use it as an implementation reference.`,
    ``,
    `- HTML weight: ${(report.stats.htmlBytes / 1024).toFixed(1)} KB`,
    `- CSS analysed: ${(report.stats.cssBytes / 1024).toFixed(1)} KB across ${report.stylesheets.length} stylesheet(s)`,
    `- Images: ${report.stats.imageCount} · Links: ${report.stats.linkCount} · Scripts: ${report.scripts}`,
    report.frameworks.length ? `- Detected technology: ${report.frameworks.join(", ")}` : null,
    ``,
    `## 2. Colour palette`,
    list(report.colors.slice(0, 16).map((c) => `${c.value} — used ${c.count} time(s)`)),
    ``,
    `## 3. Typography`,
    `**Font families**`,
    list(report.fonts),
    ``,
    `**Type scale (font sizes)**`,
    list(report.fontSizes),
    ``,
    `**Weights**`,
    list(report.fontWeights),
    ``,
    `## 4. Spacing & rhythm`,
    list(report.spacing.slice(0, 18)),
    ``,
    `## 5. Shape & depth`,
    `**Corner radii**`,
    list(report.radii),
    ``,
    `**Shadows**`,
    list(report.shadows),
    ``,
    `## 6. Design tokens found in CSS`,
    list(report.cssVariables.map((v) => `${v.name}: ${v.value}`)),
    ``,
    `## 7. Visual elements`,
    list(report.images.map((i) => `${i.src}${i.alt ? ` — "${i.alt}"` : ""}`)),
    ``,
    `## 8. Structure & composition`,
    list(report.elementCounts.map((e) => `<${e.tag}> × ${e.count}`)),
    ``,
    `**Heading outline**`,
    list(report.headings.map((h) => `${h.level.toUpperCase()}: ${h.text}`)),
    ``,
    report.buttonsSample.length ? `**Interactive labels**\n${list(report.buttonsSample)}\n` : null,
    `## 9. Implementation notes`,
    `- Recreate the palette as semantic tokens (background, foreground, primary, accent) rather than hard-coded values.`,
    `- Load the listed font families first; typography carries most of the perceived identity.`,
    `- Reuse the spacing values as a scale so vertical rhythm matches the original.`,
    `- Match corner radii and shadow depth to reproduce the component feel.`,
    ``,
    line(),
  ];

  return parts.filter((v): v is string => v !== null).join("\n");
}
