// Client-safe shared types for extraction reports.
export type ColorHit = { value: string; count: number };

export type EvidenceItem = {
  value: string;
  context?: string;
  count?: number;
};

export type TypeRole = {
  role: string;
  selector: string;
  family?: string;
  size?: string;
  weight?: string;
  style?: string;
  lineHeight?: string;
  letterSpacing?: string;
  transform?: string;
};

export type ComponentSpec = {
  type: string;
  count: number;
  variants: string[];
  states: string[];
  notes: string[];
};

export type AssetSpec = {
  type: string;
  url: string;
  format: string;
  width?: string;
  height?: string;
  alt?: string;
  loading?: string;
};

export type ResponsiveRule = {
  query: string;
  breakpoint: string;
  ruleCount: number;
  affectedSelectors: string[];
};

export type ReplicationSpec = {
  capture: {
    method: string;
    capturedAt: string;
    limitations: string[];
  };
  typography: {
    roles: TypeRole[];
    families: EvidenceItem[];
    sizes: EvidenceItem[];
    weights: EvidenceItem[];
    lineHeights: EvidenceItem[];
    letterSpacings: EvidenceItem[];
    transforms: EvidenceItem[];
    fontLoading: string[];
  };
  colors: {
    palette: ColorHit[];
    byProperty: Record<string, EvidenceItem[]>;
    themeVariations: string[];
  };
  spacing: {
    values: EvidenceItem[];
    probableBaseUnit: string | null;
    containerRules: string[];
  };
  layout: {
    displayModes: EvidenceItem[];
    gridTemplates: EvidenceItem[];
    containerWidths: EvidenceItem[];
    positions: EvidenceItem[];
    zIndices: EvidenceItem[];
  };
  components: ComponentSpec[];
  effects: {
    shadows: EvidenceItem[];
    gradients: EvidenceItem[];
    filters: EvidenceItem[];
    transitions: EvidenceItem[];
    animations: EvidenceItem[];
  };
  assets: AssetSpec[];
  responsiveness: {
    breakpoints: string[];
    rules: ResponsiveRule[];
    viewportMeta: string | null;
  };
  interaction: {
    pseudoStates: Record<string, string[]>;
    nativeBehaviors: string[];
    validation: string[];
  };
  content: {
    landmarks: EvidenceItem[];
    headingOutline: { level: string; text: string }[];
    navigation: { label: string; href: string }[];
    forms: { method: string; action: string; fields: string[] }[];
    footerLinks: { label: string; href: string }[];
    structuredDataTypes: string[];
  };
};

export type SiteReport = {
  url: string;
  title: string;
  description: string;
  favicon: string | null;
  colors: ColorHit[];
  fonts: string[];
  fontSizes: string[];
  fontWeights: string[];
  spacing: string[];
  radii: string[];
  shadows: string[];
  cssVariables: { name: string; value: string }[];
  images: { src: string; alt: string }[];
  elementCounts: { tag: string; count: number }[];
  stylesheets: string[];
  scripts: number;
  frameworks: string[];
  headings: { level: string; text: string }[];
  buttonsSample: string[];
  cssSnippet: string;
  htmlSnippet: string;
  stats: { htmlBytes: number; cssBytes: number; imageCount: number; linkCount: number };
  /** Rich category analysis. Optional so reports saved before this version still open. */
  specification?: ReplicationSpec;
};
