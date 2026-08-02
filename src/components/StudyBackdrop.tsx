import {
  GraduationCap,
  BookOpen,
  PenTool,
  Ruler,
  Lightbulb,
  Palette,
  Compass,
  Sparkles,
  NotebookPen,
  Layers,
} from "lucide-react";

type Doodle = {
  Icon: typeof GraduationCap;
  className: string;
  size: number;
  rotate: number;
  tone: string;
};

const doodles: Doodle[] = [
  { Icon: GraduationCap, className: "left-[4%] top-[12%]", size: 96, rotate: -12, tone: "text-primary" },
  { Icon: BookOpen, className: "right-[6%] top-[18%]", size: 84, rotate: 10, tone: "text-mint-foreground" },
  { Icon: PenTool, className: "left-[10%] bottom-[16%]", size: 72, rotate: 18, tone: "text-destructive" },
  { Icon: Ruler, className: "right-[9%] bottom-[22%]", size: 88, rotate: -20, tone: "text-primary" },
  { Icon: Lightbulb, className: "left-[46%] top-[6%]", size: 60, rotate: 8, tone: "text-highlight-foreground" },
  { Icon: Palette, className: "right-[22%] top-[52%]", size: 64, rotate: -6, tone: "text-accent-foreground" },
  { Icon: Compass, className: "left-[24%] top-[62%]", size: 68, rotate: 14, tone: "text-mint-foreground" },
  { Icon: Sparkles, className: "right-[38%] bottom-[8%]", size: 52, rotate: 0, tone: "text-highlight-foreground" },
  { Icon: NotebookPen, className: "left-[2%] top-[44%]", size: 58, rotate: -16, tone: "text-destructive" },
  { Icon: Layers, className: "right-[3%] top-[74%]", size: 62, rotate: 12, tone: "text-primary" },
];

/**
 * Decorative, purely visual layer: soft colour washes, a faint grid
 * and study-desk doodles (books, pens, rulers, ideas).
 */
export function StudyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* soft colour washes */}
      <div className="absolute -left-32 -top-32 size-[26rem] rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute -right-28 top-24 size-[22rem] rounded-full bg-highlight/40 blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/3 size-[24rem] rounded-full bg-mint/40 blur-3xl" />
      <div className="absolute bottom-16 right-1/4 size-[16rem] rounded-full bg-destructive/15 blur-3xl" />

      {/* notebook grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--primary) 30%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 30%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 78%)",
        }}
      />

      {/* study doodles */}
      {doodles.map(({ Icon, className, size, rotate, tone }, i) => (
        <Icon
          key={i}
          strokeWidth={1}
          className={`absolute ${className} ${tone} opacity-[0.13] animate-float-slow`}
          style={{
            width: size,
            height: size,
            transform: `rotate(${rotate}deg)`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}
