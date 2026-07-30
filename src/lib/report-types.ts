// Client-safe shared types for extraction reports.
export type ColorHit = { value: string; count: number };

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
};
