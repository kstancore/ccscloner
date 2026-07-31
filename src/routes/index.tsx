import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Palette,
  Type,
  Ruler,
  Code2,
  BarChart3,
  FileDown,
  ArrowRight,
} from "lucide-react";
import heroImage from "@/assets/hero-extract.jpg";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CCSCloner — Extract any website's visual identity" },
      {
        name: "description",
        content:
          "Paste a URL and CCSCloner extracts colours, typography, spacing, visual elements and code into an editable, downloadable design guide.",
      },
      { property: "og:title", content: "CCSCloner — Extract any website's visual identity" },
      {
        property: "og:description",
        content:
          "Paste a URL and get a complete visual identity guide: colours, typography, spacing, components and downloadable PDF or DOCX documentation.",
      },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: Palette,
    title: "Colour system",
    body: "Every hex, rgb and oklch value ranked by how often the page uses it, so you can rebuild the palette in minutes.",
  },
  {
    icon: Type,
    title: "Typography",
    body: "Font families, the full type scale and weight ladder pulled straight from the stylesheets.",
  },
  {
    icon: Ruler,
    title: "Spacing & shape",
    body: "Margins, padding, gaps, corner radii and shadow depth — the rhythm that makes a layout feel right.",
  },
  {
    icon: Code2,
    title: "Code & tokens",
    body: "CSS custom properties, stylesheet sources and detected frameworks, captured as raw reference.",
  },
  {
    icon: BarChart3,
    title: "Visualisations",
    body: "Charts of element composition and colour distribution so structure is visible at a glance.",
  },
  {
    icon: FileDown,
    title: "Downloadable guides",
    body: "Edit the generated documentation, then export it as a polished PDF or Word document.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-soft-gradient">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo size="sm" />

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/features">Features</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:pt-16">
        <div>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Paste a URL. Get the whole visual identity.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            CCSCloner reads a web page and returns everything you need to understand and
            implement its visual identity — colours, typography, spacing, visual elements,
            underlying code and structure — as an editable guide you can download.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Start extracting <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/features">See how it works</Link>
            </Button>
          </div>
        </div>

        <img
          src={heroImage}
          width={1600}
          height={1104}
          alt="A web page being decomposed into colour swatches, type specimens and spacing rulers"
          className="rounded-2xl border border-border shadow-lift"
        />
      </section>

      <footer className="border-t border-border/70 py-8">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} CCSCloner — understand and implement any website's visual
          identity.
        </p>
      </footer>
    </div>
  );
}
