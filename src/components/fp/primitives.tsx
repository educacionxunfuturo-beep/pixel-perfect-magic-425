import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/official-logo.png";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoImg}
      alt="The Fresh Pooch official logo"
      className={cn("h-10 w-10 object-contain rounded-full bg-white p-0.5 shadow-sm border border-border/40", className)}
    />
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
      {eyebrow && <div className="eyebrow mb-2 text-gold">{eyebrow}</div>}
      <h2 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h2>
      {sub && <p className="mt-2 max-w-2xl text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function PawLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="var(--teal)" />
      <g fill="var(--gold)">
        <ellipse cx="13" cy="15" rx="3" ry="4" />
        <ellipse cx="20" cy="11.5" rx="3" ry="4" />
        <ellipse cx="27" cy="15" rx="3" ry="4" />
        <path d="M20 19c-5 0-9 5-9 9 0 3 3 4 5 3s3-1.5 4-1.5 2 .5 4 1.5 5 0 5-3c0-4-4-9-9-9z" />
      </g>
    </svg>
  );
}

