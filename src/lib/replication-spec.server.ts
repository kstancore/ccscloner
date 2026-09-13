import type {
  AssetSpec,
  ComponentSpec,
  EvidenceItem,
  ReplicationSpec,
  ResponsiveRule,
  TypeRole,
} from "./report-types";

type CssRule = { selectors: string[]; declarations: Map<string, string> };

const cleanText = (value: string) =>
  value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

const absolute = (href: string, base: string) => {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
};

const attr = (tag: string, name: string) => {
  const quoted = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
  if (quoted !== undefined) return quoted;
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, "i"))?.[1] ?? "";
};

const unique = <T>(items: T[], key: (item: T) => string, limit = 100) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = key(item);
    if (!id || seen.has(id) || seen.size >= limit) return false;
    seen.add(id);
    return true;
  });
};

function frequency(values: { value: string; context?: string }[], limit = 30): EvidenceItem[] {
  const map = new Map<string, EvidenceItem>();
  for (const item of values) {
    const value = item.value.trim();
    if (!value) continue;
    const current = map.get(value);
    if (current) current.count = (current.count ?? 1) + 1;
    else map.set(value, { value, context: item.context, count: 1 });
  }
  return [...map.values()].sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, limit);
}

function parseCssRules(css: string): CssRule[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: CssRule[] = [];
  for (const match of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectorText = match[1].trim();
    if (!selectorText || selectorText.startsWith("@")) continue;
    const declarations = new Map<string, string>();
    for (const declaration of match[2].split(";")) {
      const colon = declaration.indexOf(":");
      if (colon < 1) continue;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      if (property && value) declarations.set(property, value);
    }
    if (declarations.size) {
      rules.push({ selectors: selectorText.split(",").map((value) => value.trim()), declarations });
    }
  }
  return rules;
}

function valuesFor(rules: CssRule[], properties: string[], limit = 30): EvidenceItem[] {
  const hits: { value: string; context?: string }[] = [];
  for (const rule of rules) {
    for (const property of properties) {
      const value = rule.declarations.get(property);
      if (value) hits.push({ value, context: `${property} · ${rule.selectors.slice(0, 2).join(", ")}` });
    }
  }
  return frequency(hits, limit);
}

function typeRoles(rules: CssRule[]): TypeRole[] {
  const roles: { role: string; pattern: RegExp }[] = [
    { role: "H1", pattern: /(^|[\s>+~,.])h1([\s:#.[>+~]|$)/i },
    { role: "H2", pattern: /(^|[\s>+~,.])h2([\s:#.[>+~]|$)/i },
    { role: "H3", pattern: /(^|[\s>+~,.])h3([\s:#.[>+~]|$)/i },
    { role: "H4", pattern: /(^|[\s>+~,.])h4([\s:#.[>+~]|$)/i },
    { role: "H5", pattern: /(^|[\s>+~,.])h5([\s:#.[>+~]|$)/i },
    { role: "H6", pattern: /(^|[\s>+~,.])h6([\s:#.[>+~]|$)/i },
    { role: "Body", pattern: /(^|[\s>+~,.])(body|p)([\s:#.[>+~]|$)/i },
    { role: "Button", pattern: /button|\.btn|\[type=['"]?submit/i },
    { role: "Label", pattern: /(^|[\s>+~,.])label([\s:#.[>+~]|$)|\.label/i },
    { role: "Caption", pattern: /caption|\.caption|\.eyebrow|\.kicker|\.small/i },
  ];
  const result: TypeRole[] = [];
  for (const { role, pattern } of roles) {
    for (const rule of rules) {
      const selector = rule.selectors.find((candidate) => pattern.test(candidate));
      if (!selector) continue;
      const entry: TypeRole = {
        role,
        selector,
        family: rule.declarations.get("font-family"),
        size: rule.declarations.get("font-size"),
        weight: rule.declarations.get("font-weight"),
        style: rule.declarations.get("font-style"),
        lineHeight: rule.declarations.get("line-height"),
        letterSpacing: rule.declarations.get("letter-spacing"),
        transform: rule.declarations.get("text-transform"),
      };
      if (Object.values(entry).some((value, index) => index > 1 && value)) result.push(entry);
    }
  }
  return unique(result, (item) => `${item.role}:${item.selector}`, 40);
}

function extractMediaRules(css: string): ResponsiveRule[] {
  const results: ResponsiveRule[] = [];
  const mediaStart = /@media\s*([^\{]+)\{/gi;
  let match: RegExpExecArray | null;
  while ((match = mediaStart.exec(css))) {
    let depth = 1;
    let cursor = mediaStart.lastIndex;
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === "{") depth += 1;
      else if (css[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    const query = match[1].trim();
    const body = css.slice(mediaStart.lastIndex, Math.max(mediaStart.lastIndex, cursor - 1));
    const selectors = [...body.matchAll(/([^{}]+)\{/g)]
      .flatMap((item) => item[1].split(","))
      .map((item) => item.trim())
      .filter((item) => item && !item.startsWith("@"));
    const breakpoint =
      query.match(/(?:min|max)-(?:width|height)\s*:\s*([^)]+)/i)?.[1].trim() ?? "conditional";
    results.push({
      query,
      breakpoint,
      ruleCount: (body.match(/\{/g) ?? []).length,
      affectedSelectors: unique(selectors, (item) => item, 12),
    });
    mediaStart.lastIndex = cursor;
  }
  return unique(results, (item) => item.query, 30);
}

function componentsFromHtml(html: string, rules: CssRule[]): ComponentSpec[] {
  const definitions: { type: string; regex: RegExp; note: string }[] = [
    { type: "Buttons", regex: /<button\b|<input[^>]+type=["']?(?:submit|button)/gi, note: "Native button controls" },
    { type: "Links", regex: /<a\b/gi, note: "Anchor navigation and calls to action" },
    { type: "Inputs", regex: /<(?:input|textarea|select)\b/gi, note: "Form inputs" },
    { type: "Forms", regex: /<form\b/gi, note: "Form groups" },
    { type: "Navigation", regex: /<nav\b/gi, note: "Navigation landmarks" },
    { type: "Cards", regex: /class=["'][^"']*(?:card|tile|panel)[^"']*["']/gi, note: "Class-named card, tile, or panel patterns" },
    { type: "Dialogs", regex: /<(?:dialog)\b|role=["']dialog["']/gi, note: "Dialogs and modal surfaces" },
    { type: "Accordions", regex: /<details\b|aria-expanded=/gi, note: "Expandable disclosure controls" },
    { type: "Media", regex: /<(?:img|picture|video|svg|canvas)\b/gi, note: "Visual media" },
    { type: "Lists", regex: /<(?:ul|ol)\b/gi, note: "Ordered and unordered content groups" },
  ];
  return definitions.flatMap(({ type, regex, note }) => {
    const count = (html.match(regex) ?? []).length;
    if (!count) return [];
    const keyword = type.toLowerCase().replace(/s$/, "");
    const selectors = rules.flatMap((rule) => rule.selectors).filter((selector) => selector.toLowerCase().includes(keyword));
    const variants = unique(
      selectors.flatMap((selector) => [...selector.matchAll(/[.#]([a-z0-9_-]+)/gi)].map((item) => item[1])),
      (item) => item,
      12,
    );
    const states = unique(
      selectors.flatMap((selector) => [...selector.matchAll(/:(hover|focus-visible|focus|active|disabled|checked|open)/gi)].map((item) => item[1])),
      (item) => item,
      8,
    );
    return [{ type, count, variants, states, notes: [note] }];
  });
}

function assetsFromHtml(html: string, base: string): AssetSpec[] {
  const assets: AssetSpec[] = [];
  for (const match of html.matchAll(/<(img|source|video|link)\b[^>]*>/gi)) {
    const tag = match[0];
    const kind = match[1].toLowerCase();
    if (kind === "link" && !/(?:icon|manifest|apple-touch-icon)/i.test(attr(tag, "rel"))) continue;
    const source = attr(tag, kind === "link" ? "href" : "src") || attr(tag, "srcset").split(/[\s,]/)[0];
    if (!source || source.startsWith("data:")) continue;
    const pathname = source.split(/[?#]/)[0];
    const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase() ?? "unknown";
    assets.push({
      type: kind === "link" ? attr(tag, "rel") || "linked asset" : kind,
      url: absolute(source, base),
      format: extension,
      width: attr(tag, "width") || undefined,
      height: attr(tag, "height") || undefined,
      alt: attr(tag, "alt") || undefined,
      loading: attr(tag, "loading") || undefined,
    });
  }
  return unique(assets, (item) => item.url, 60);
}

function probableBaseUnit(values: EvidenceItem[]) {
  const pixels = values
    .flatMap((item) => [...item.value.matchAll(/(-?[\d.]+)px/g)].map((match) => Math.abs(Number(match[1]))))
    .filter((value) => Number.isFinite(value) && value > 0 && Number.isInteger(value));
  if (pixels.length < 3) return null;
  const candidates = [8, 4, 5, 6, 10, 12, 16];
  const scored = candidates.map((unit) => ({ unit, score: pixels.filter((value) => value % unit === 0).length / pixels.length }));
  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best && best.score >= 0.45 ? `${best.unit}px (inferred from ${Math.round(best.score * 100)}% of pixel values)` : null;
}

export function buildReplicationSpec({
  html,
  css,
  url,
  colors,
}: {
  html: string;
  css: string;
  url: string;
  colors: { value: string; count: number }[];
}): ReplicationSpec {
  const rules = parseCssRules(css);
  const mediaRules = extractMediaRules(css);
  const propertyGroups: Record<string, string[]> = {
    backgrounds: ["background", "background-color"],
    text: ["color"],
    borders: ["border-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    shadows: ["box-shadow", "text-shadow"],
    overlays: ["opacity", "background-blend-mode", "mix-blend-mode"],
  };
  const byProperty = Object.fromEntries(
    Object.entries(propertyGroups).map(([name, properties]) => [name, valuesFor(rules, properties, 20)]),
  );
  const spacingValues = valuesFor(
    rules,
    ["margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "gap", "row-gap", "column-gap"],
    40,
  );
  const headings = [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((match) => ({ level: match[1].toLowerCase(), text: cleanText(match[2]).slice(0, 180) }))
    .filter((item) => item.text)
    .slice(0, 60);
  const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => ({
    label: cleanText(match[0]).slice(0, 120) || "Unlabelled link",
    href: absolute(attr(match[0], "href"), url),
  }));
  const navHtml = [...html.matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi)].map((item) => item[0]).join("\n");
  const footerHtml = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] ?? "";
  const extractLinks = (source: string) =>
    unique(
      [...source.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => ({
        label: cleanText(match[0]).slice(0, 120) || "Unlabelled link",
        href: absolute(attr(match[0], "href"), url),
      })),
      (item) => `${item.label}:${item.href}`,
      50,
    );
  const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map((match) => ({
    method: (attr(match[0], "method") || "GET").toUpperCase(),
    action: absolute(attr(match[0], "action") || url, url),
    fields: unique(
      [...match[0].matchAll(/<(?:input|textarea|select)\b[^>]*>/gi)].map((field) =>
        attr(field[0], "name") || attr(field[0], "aria-label") || attr(field[0], "type") || field[0].match(/^<([a-z]+)/i)?.[1] || "field",
      ),
      (item) => item,
      30,
    ),
  }));
  const pseudoStates: Record<string, string[]> = {};
  for (const state of ["hover", "focus", "focus-visible", "active", "disabled", "checked", "visited"]) {
    pseudoStates[state] = unique(
      rules.flatMap((rule) => rule.selectors.filter((selector) => selector.includes(`:${state}`))),
      (item) => item,
      20,
    );
  }
  const fontLoading = unique(
    [
      ...[...html.matchAll(/<link\b[^>]+href=["']([^"']*(?:fonts|\.woff|\.ttf|\.otf)[^"']*)["'][^>]*>/gi)].map((match) => absolute(match[1], url)),
      ...[...css.matchAll(/@font-face\s*\{[\s\S]*?\}/gi)].map((match) => cleanText(match[0]).slice(0, 300)),
      ...[...css.matchAll(/@import\s+(?:url\()?['"]?([^'"\s)]+)[^;]*;/gi)].map((match) => absolute(match[1], url)),
    ],
    (item) => item,
    20,
  );
  const themeVariations = unique(
    rules
      .flatMap((rule) => rule.selectors)
      .filter((selector) => /(?:dark|light|theme|color-scheme|prefers-color-scheme)/i.test(selector)),
    (item) => item,
    20,
  );
  if (/prefers-color-scheme/i.test(css)) themeVariations.push("Uses prefers-color-scheme media query");
  const landmarks = ["header", "nav", "main", "aside", "section", "article", "footer"].map((tag) => ({
    value: tag,
    count: (html.match(new RegExp(`<${tag}\\b`, "gi")) ?? []).length,
  })).filter((item) => item.count > 0);
  const structuredDataTypes = unique(
    [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) =>
      [...match[1].matchAll(/["']@type["']\s*:\s*["']([^"']+)/gi)].map((item) => item[1]),
    ),
    (item) => item,
    20,
  );

  return {
    capture: {
      method: "HTML and linked stylesheet source analysis",
      capturedAt: new Date().toISOString(),
      limitations: [
        "Values created only after client-side JavaScript runs may not appear in the source.",
        "Cross-origin, blocked, authenticated, and bot-protected assets may be unavailable.",
        "Responsive behavior is inferred from media queries rather than screenshots at every viewport.",
      ],
    },
    typography: {
      roles: typeRoles(rules),
      families: valuesFor(rules, ["font-family"], 30),
      sizes: valuesFor(rules, ["font-size"], 30),
      weights: valuesFor(rules, ["font-weight"], 20),
      lineHeights: valuesFor(rules, ["line-height"], 20),
      letterSpacings: valuesFor(rules, ["letter-spacing"], 20),
      transforms: valuesFor(rules, ["text-transform"], 12),
      fontLoading,
    },
    colors: { palette: colors, byProperty, themeVariations },
    spacing: {
      values: spacingValues,
      probableBaseUnit: probableBaseUnit(spacingValues),
      containerRules: rules
        .filter((rule) => [...rule.declarations.keys()].some((property) => /^(?:width|max-width|min-width|padding|margin)$/.test(property)))
        .filter((rule) => rule.selectors.some((selector) => /container|wrapper|section|main|body/i.test(selector)))
        .slice(0, 25)
        .map((rule) => `${rule.selectors.join(", ")} { ${[...rule.declarations].map(([key, value]) => `${key}: ${value}`).join("; ")} }`),
    },
    layout: {
      displayModes: valuesFor(rules, ["display"], 20),
      gridTemplates: valuesFor(rules, ["grid-template-columns", "grid-template-rows", "grid-auto-flow"], 20),
      containerWidths: valuesFor(rules, ["width", "min-width", "max-width"], 30),
      positions: valuesFor(rules, ["position", "inset", "top", "right", "bottom", "left"], 30),
      zIndices: valuesFor(rules, ["z-index"], 20),
    },
    components: componentsFromHtml(html, rules),
    effects: {
      shadows: valuesFor(rules, ["box-shadow", "text-shadow"], 25),
      gradients: frequency(
        [...css.matchAll(/(?:linear|radial|conic)-gradient\([^;{}]+\)/gi)].map((match) => ({ value: match[0] })),
        20,
      ),
      filters: valuesFor(rules, ["filter", "backdrop-filter"], 20),
      transitions: valuesFor(rules, ["transition", "transition-property", "transition-duration", "transition-timing-function"], 25),
      animations: valuesFor(rules, ["animation", "animation-name", "animation-duration", "animation-timing-function"], 25),
    },
    assets: assetsFromHtml(html, url),
    responsiveness: {
      breakpoints: unique(mediaRules.map((item) => item.breakpoint), (item) => item, 30),
      rules: mediaRules,
      viewportMeta: html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null,
    },
    interaction: {
      pseudoStates,
      nativeBehaviors: [
        ...(html.includes("<details") ? ["Native details/summary disclosure"] : []),
        ...(html.includes("<dialog") ? ["Native dialog"] : []),
        ...(html.includes("draggable=") ? ["Draggable elements"] : []),
        ...(html.includes("tabindex=") ? ["Custom keyboard tab order or focus targets"] : []),
        ...(html.includes("aria-expanded=") ? ["ARIA-controlled expandable elements"] : []),
      ],
      validation: unique(
        [...html.matchAll(/<(?:input|textarea|select)\b[^>]*(?:required|pattern=|minlength=|maxlength=|min=|max=)[^>]*>/gi)].map((match) =>
          cleanText(match[0].replace(/</g, "&lt;")).slice(0, 220),
        ),
        (item) => item,
        30,
      ),
    },
    content: {
      landmarks,
      headingOutline: headings,
      navigation: extractLinks(navHtml).length ? extractLinks(navHtml) : unique(links, (item) => `${item.label}:${item.href}`, 30),
      forms,
      footerLinks: extractLinks(footerHtml),
      structuredDataTypes,
    },
  };
}