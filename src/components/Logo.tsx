import logoAsset from "@/assets/ccscloner-logo.png.asset.json";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: { box: "size-9 rounded-xl p-1.5", img: "size-full", text: "text-lg" },
  md: { box: "size-11 rounded-2xl p-2", img: "size-full", text: "text-xl" },
  lg: { box: "size-16 rounded-3xl p-3", img: "size-full", text: "text-3xl" },
} as const;

export function Logo({ size = "sm", showWordmark = true, className }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5 leading-none", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center border border-border/60 bg-card shadow-sm",
          s.box,
        )}
      >
        <img
          src={logoAsset.url}
          alt="CCSCloner logo"
          className={cn("object-contain", s.img)}
          loading="eager"
          decoding="async"
        />
      </span>
      {showWordmark && (
        <span
          className={cn(
            "font-display font-semibold tracking-[-0.02em] text-foreground",
            s.text,
          )}
        >
          CCSCloner
        </span>
      )}
    </span>
  );
}
