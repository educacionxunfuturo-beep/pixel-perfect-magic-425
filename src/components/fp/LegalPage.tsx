import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "./primitives";
import { SiteFooter } from "./PublicSections";
import { CookieNotice } from "./CookieNotice";

/** Shared frame of the legal pages (/privacy, /terms): brand header, title, table of contents, footer. */
export function LegalPage({ eyebrow, title, intro, toc, children }: { eyebrow: string; title: string; intro: ReactNode; toc: [string, string][]; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="h-[3px] bg-[linear-gradient(90deg,var(--teal-deep),var(--aqua)_45%,var(--aqua)_75%,var(--gold))]" aria-hidden />
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <a href="/" className="flex items-center gap-3">
            <BrandLogo className="h-11 w-11" />
            <span className="font-serif text-lg font-semibold text-ink">The Fresh Pooch</span>
          </a>
          <a href="/" className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-teal hover:border-teal">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="eyebrow mb-2 flex items-center gap-2.5 text-gold-deep">
          <span className="h-[2px] w-7 rounded-full bg-gradient-gold" aria-hidden /> {eyebrow}
        </div>
        <h1 className="font-serif text-4xl font-semibold text-ink md:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{intro}</p>

        <nav aria-label="On this page" className="mt-8 grid gap-2 rounded-2xl border border-border bg-card p-5 text-sm sm:grid-cols-2">
          {toc.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="text-teal hover:underline">{label}</a>
          ))}
        </nav>

        <div className="mt-10 space-y-8">{children}</div>
      </main>

      <SiteFooter />
      <CookieNotice />
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-8">
      <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

export const legalLink = "font-semibold text-teal underline";
