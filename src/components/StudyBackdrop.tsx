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
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* ambient office light washes */}
      <div className="absolute -left-32 -top-32 size-[26rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-28 top-24 size-[22rem] rounded-full bg-highlight/35 blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/3 size-[24rem] rounded-full bg-mint/35 blur-3xl" />
      <div className="absolute bottom-16 right-1/4 size-[16rem] rounded-full bg-destructive/12 blur-3xl" />

      {/* window light shafts from the top-left, like a corner office */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(115deg, color-mix(in oklab, var(--highlight) 45%, transparent) 0%, transparent 26%, color-mix(in oklab, var(--highlight) 28%, transparent) 34%, transparent 55%)",
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
          className={`absolute ${className} ${tone} opacity-35 animate-float-slow drop-shadow-sm`}
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
