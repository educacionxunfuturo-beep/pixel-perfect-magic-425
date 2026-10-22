import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/fresh-pooch-logo.webp";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoImg}
      alt="The Fresh Pooch official logo"
      width={512}
      height={512}
      className={cn("h-10 w-10 rounded-full bg-white object-contain shadow-sm ring-1 ring-aqua/25", className)}
    />
  );
}

/** The official logo shown as a seal: white disc, brand-turquoise halo and a soft lift shadow. */
export function BrandSeal({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <div className={cn("relative aspect-square rounded-full bg-white p-[3%] shadow-lift ring-1 ring-aqua/20", className)}>
      <div className="absolute -inset-[6%] -z-10 rounded-full bg-aqua/15 blur-xl" aria-hidden />
      <img
        src={logoImg}
        alt={decorative ? "" : "The Fresh Pooch, mobile dog wash & grooming"}
        width={512}
        height={512}
        loading="lazy"
        className="h-full w-full rounded-full object-contain"
      />
    </div>
  );
}

const BUBBLES = [
  { x: "1%", y: "34%", s: 40, d: "0s" },
  { x: "12%", y: "70%", s: 22, d: "1.4s" },
  { x: "36%", y: "4%", s: 16, d: "2.2s" },
  { x: "49%", y: "86%", s: 30, d: "0.6s" },
  { x: "58%", y: "12%", s: 58, d: "3s" },
  { x: "88%", y: "62%", s: 34, d: "1.9s" },
  { x: "95%", y: "20%", s: 18, d: "0.9s" },
];

/** Soap bubbles from the logo, as a quiet background texture. */
export function Bubbles({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden md:block", className)} aria-hidden>
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="animate-bubble absolute rounded-full border border-aqua/30 bg-[radial-gradient(circle_at_30%_28%,rgb(255_255_255/0.95)_0_12%,rgb(3_187_199/0.10)_36%,rgb(3_187_199/0.04)_70%)]"
          style={{ left: b.x, top: b.y, width: b.s, height: b.s, animationDelay: b.d }}
        />
      ))}
    </div>
  );
}


export function Chip({
  active,
  onClick,
  children,
  size = "md",
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border font-semibold transition-all active:scale-[0.97]",
        size === "lg" ? "px-5 py-3 text-base" : "px-4 py-2 text-sm",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-lift"
          : "border-border bg-card text-foreground hover:border-sage hover:bg-sage-soft",
      )}
    >
      {children}
    </button>
  );
}

const pillTones = {
  teal: "bg-sage-soft text-teal",
  gold: "bg-gold-soft text-accent-foreground",
  success: "bg-success-soft text-success",
  ink: "bg-ink text-ink-foreground",
  muted: "bg-muted text-muted-foreground",
  warning: "bg-warning-soft text-accent-foreground",
} as const;

export function Pill({
  tone = "teal",
  children,
  className,
}: {
  tone?: keyof typeof pillTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        pillTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <div className="eyebrow mb-2 flex items-center gap-2.5 text-gold-deep">
          <span className="h-[2px] w-7 rounded-full bg-gradient-gold" aria-hidden />
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h2>
      {sub && <p className="mt-2 max-w-2xl text-muted-foreground">{sub}</p>}
    </div>
  );
}
