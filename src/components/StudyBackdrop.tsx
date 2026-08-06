import {
  Monitor,
  Laptop,
  Coffee,
  Briefcase,
  Lamp,
  CalendarDays,
  FileText,
  Presentation,
  Mouse,
  Paperclip,
} from "lucide-react";

type Doodle = {
  Icon: typeof Monitor;
  className: string;
  size: number;
  rotate: number;
  tone: string;
};

const doodles: Doodle[] = [
  { Icon: Monitor, className: "left-[4%] top-[14%]", size: 92, rotate: -6, tone: "text-primary" },
  { Icon: Laptop, className: "right-[6%] top-[20%]", size: 86, rotate: 6, tone: "text-mint-foreground" },
  { Icon: Coffee, className: "left-[11%] bottom-[18%]", size: 66, rotate: 10, tone: "text-destructive" },
  { Icon: Briefcase, className: "right-[9%] bottom-[24%]", size: 78, rotate: -10, tone: "text-primary" },
  { Icon: Lamp, className: "left-[45%] top-[5%]", size: 62, rotate: 4, tone: "text-highlight-foreground" },
  { Icon: Presentation, className: "right-[23%] top-[52%]", size: 70, rotate: -4, tone: "text-accent-foreground" },
  { Icon: CalendarDays, className: "left-[24%] top-[62%]", size: 64, rotate: 8, tone: "text-mint-foreground" },
  { Icon: Paperclip, className: "right-[38%] bottom-[10%]", size: 48, rotate: -18, tone: "text-highlight-foreground" },
  { Icon: FileText, className: "left-[2%] top-[46%]", size: 56, rotate: -8, tone: "text-destructive" },
  { Icon: Mouse, className: "right-[3%] top-[74%]", size: 52, rotate: 12, tone: "text-primary" },
];

/**
 * Decorative, purely visual layer: an office/workspace scene —
 * window light, blueprint grid, desk surface band and desk-object doodles.
 */
export function StudyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-soft-gradient">
      {/* ambient office light washes — painted as gradients (no blur filters) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(38rem 30rem at 0% 0%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%)",
            "radial-gradient(32rem 26rem at 100% 16%, color-mix(in oklab, var(--highlight) 32%, transparent), transparent 70%)",
            "radial-gradient(34rem 28rem at 38% 110%, color-mix(in oklab, var(--mint) 32%, transparent), transparent 70%)",
            "radial-gradient(22rem 18rem at 76% 88%, color-mix(in oklab, var(--destructive) 12%, transparent), transparent 70%)",
            "linear-gradient(115deg, color-mix(in oklab, var(--highlight) 20%, transparent) 0%, transparent 26%, color-mix(in oklab, var(--highlight) 12%, transparent) 34%, transparent 55%)",
          ].join(","),
        }}
      />

      {/* blueprint / floorplan grid */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--primary) 34%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 34%, transparent) 1px, transparent 1px), linear-gradient(to right, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px)",
          backgroundSize: "160px 160px, 160px 160px, 32px 32px, 32px 32px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 15%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 15%, transparent 80%)",
        }}
      />

      {/* desk surface band along the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-[26vh]"
        style={{
          backgroundImage:
            "linear-gradient(to top, color-mix(in oklab, var(--accent) 30%, transparent) 0%, transparent 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-[26vh] h-px bg-border/70" />

      {/* desk objects */}
      {doodles.map(({ Icon, className, size, rotate, tone }, i) => (
        <Icon
          key={i}
          strokeWidth={1.5}
          className={`absolute ${className} ${tone} opacity-60 animate-float-slow`}
          style={{
            width: size,
            height: size,
            rotate: `${rotate}deg`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}
