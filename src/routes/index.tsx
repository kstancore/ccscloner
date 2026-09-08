import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-extract.jpg";
import { PublicHeader } from "@/components/PublicHeader";
import { StudyBackdrop } from "@/components/StudyBackdrop";
import { Button } from "@/components/ui/button";

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

function Home() {
  // Signed-in visitors go straight to their workspace instead of a login prompt.
  const { isAuthenticated, profile } = useSession();

  return (
    <div className="relative min-h-screen">
      <StudyBackdrop />
      <PublicHeader />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:pt-16">
        <div>
          {isAuthenticated && profile?.nickname ? (
            <p className="mb-2 text-sm font-medium text-primary">
              Welcome back, {profile.nickname}.
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Paste a URL. Get the whole visual identity.
          </h1>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={isAuthenticated ? "/workspace" : "/auth"}>
                {isAuthenticated ? "Go to workspace" : "Start extracting"} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
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
