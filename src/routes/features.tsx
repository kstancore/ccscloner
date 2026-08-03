import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Palette,
  Type,
  Ruler,
  Code2,
  BarChart3,
  FileDown,
  ArrowRight,
  CheckCircle2,
  Home as HomeIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { StudyBackdrop } from "@/components/StudyBackdrop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "What CCSCloner extracts the design intelligence we extract" },
      {
        name: "description",
        content:
          "See every layer of design intelligence CCSCloner pulls from a URL: colours, typography, spacing, code, visualisations and downloadable guides.",
      },
      { property: "og:title", content: "What CCSCloner extracts" },
      {
        property: "og:description",
        content:
          "Six layers of documentation from one URL: colours, typography, spacing, code, visualisations and downloadable guides.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
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

const steps = [
  {
    step: "01",
    title: "Create your account",
    body: "Tell us your nickname and where you work or study. Your profile powers the personalised workspace.",
  },
  {
    step: "02",
    title: "Paste a URL",
    body: "Drop any public page into the workspace and press start. Our engine reads the visual system in seconds.",
  },
  {
    step: "03",
    title: "Edit & download",
    body: "Refine the generated guide, then export it as a polished PDF or DOCX you can share with your team.",
  },
];

function FeaturesPage() {
  return (
    <div className="relative min-h-screen">
      <StudyBackdrop />
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 px-4 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link to="/">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <HomeIcon /> Home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
        </div>
      </header>

      <section className="bg-highlight/85 px-4 py-16 text-highlight-foreground md:py-24">

        <div className="mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
            What we extract
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Six layers of design intelligence from one URL.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed opacity-90">
            CCSCloner reads a web page and returns everything you need to understand and
            implement its visual identity — colours, typography, spacing, visual elements,
            underlying code and structure — as an editable guide you can download.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Link to="/auth">
                Start extracting <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-highlight-foreground/30 bg-highlight/50 text-highlight-foreground hover:bg-highlight/70">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">What we extract</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              One analysis pass, six layers of documentation.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            <CheckCircle2 className="size-3.5" />
            Automatic & instant
          </span>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border/80 bg-card/85 shadow-soft backdrop-blur-sm">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-highlight text-highlight-foreground">
                  <f.icon className="size-5" />
                </span>
                <CardTitle className="pt-2 text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-destructive/95 px-4 py-16 text-destructive-foreground md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <p className="mt-2 max-w-2xl text-sm opacity-90">
            From account creation to downloadable guide in three simple steps.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(({ step, title, body }) => (
              <div
                key={step}
                className="rounded-2xl bg-destructive-foreground/10 p-6 backdrop-blur-sm"
              >
                <span className="text-5xl font-bold opacity-20">{step}</span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm opacity-90">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Ready to clone a visual identity?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Create your free account, paste your first URL and see the full design breakdown in seconds.
        </p>
        <Button asChild size="lg" className="mt-6 bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <Link to="/auth">
            Get started free <ArrowRight />
          </Link>
        </Button>
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
