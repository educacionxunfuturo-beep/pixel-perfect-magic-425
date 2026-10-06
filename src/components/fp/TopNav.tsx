import { Globe, PawPrint, Truck, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PawLogo } from "./primitives";

export type Surface = "public" | "portal" | "groomer" | "admin";

const tabs: { id: Surface; label: string; short: string; icon: typeof Globe }[] = [
  { id: "public", label: "Public Web & Quote", short: "Web", icon: Globe },
  { id: "portal", label: "Customer Portal", short: "Portal", icon: PawPrint },
  { id: "groomer", label: "Groomer Field Mode", short: "Van", icon: Truck },
  { id: "admin", label: "Admin Ops", short: "Admin", icon: BarChart3 },
];

export function TopNav({ surface, onChange }: { surface: Surface; onChange: (s: Surface) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <button onClick={() => onChange("public")} className="flex items-center gap-2.5">
          <PawLogo className="h-9 w-9" />
          <div className="text-left leading-tight">
            <div className="font-serif text-lg font-semibold text-teal">The Fresh Pooch</div>
            <div className="eyebrow text-[0.6rem] text-muted-foreground">Mobile Dog Spa & OS</div>
          </div>
        </button>

        <nav className="order-3 flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm lg:order-none lg:mx-auto lg:w-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = surface === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-all lg:flex-none lg:px-4",
                  active ? "bg-ink text-ink-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-teal lg:ml-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Service Active • Toronto & Midtown
        </div>
      </div>
    </header>
  );
}
