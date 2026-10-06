import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav, type Surface } from "@/components/fp/TopNav";
import { PublicSurface } from "@/components/fp/PublicSurface";
import { PortalSurface } from "@/components/fp/PortalSurface";
import { GroomerSurface } from "@/components/fp/GroomerSurface";
import { AdminSurface } from "@/components/fp/AdminSurface";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Fresh Pooch — Toronto Mobile Dog Spa" },
      {
        name: "description",
        content:
          "Toronto's premier cage-free mobile dog spa in a vintage luxury trailer. Instant quotes, live groom tracking, and 1-tap rebooking.",
      },
      { property: "og:title", content: "The Fresh Pooch — Toronto Mobile Dog Spa" },
      {
        property: "og:description",
        content:
          "1-on-1 cage-free grooming at your doorstep. Get an instant quote in under 90 seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [surface, setSurface] = useState<Surface>("public");

  return (
    <div className="min-h-screen bg-background">
      <TopNav surface={surface} onChange={setSurface} />
      <main>
        {surface === "public" && <PublicSurface />}
        {surface === "portal" && <PortalSurface />}
        {surface === "groomer" && <GroomerSurface />}
        {surface === "admin" && <AdminSurface />}
      </main>
      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:px-6">
          <span className="font-serif text-lg font-semibold text-teal">The Fresh Pooch</span>
          <span>Licensed & insured • Toronto & GTA • Organic products only</span>
          <span>© 2026 The Fresh Pooch Mobile Spa</span>
        </div>
      </footer>
    </div>
  );
}
