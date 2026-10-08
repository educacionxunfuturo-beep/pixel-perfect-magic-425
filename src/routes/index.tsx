import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopNav, type Surface } from "@/components/fp/TopNav";
import { PublicSurface } from "@/components/fp/PublicSurface";
import { PortalSurface } from "@/components/fp/PortalSurface";
import { GroomerSurface } from "@/components/fp/GroomerSurface";
import { SiteFooter } from "@/components/fp/PublicSections";
import { QimmiqAssistant } from "@/components/fp/QimmiqAssistant";
import { AdminSurface } from "@/components/fp/AdminSurface";
import { PromoModal } from "@/components/fp/PromoModal";

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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  const handleNavChange = (s: Surface) => {
    if (s === "portal" && isAdminAuthenticated) {
      setSurface("admin");
    } else {
      setSurface(s);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav surface={surface} onChange={handleNavChange} />
      <main>
        {surface === "public" && <PublicSurface onOpenPortal={() => handleNavChange("portal")} />}
        {surface === "portal" && (
          <PortalSurface
            onAdminLogin={() => {
              setIsAdminAuthenticated(true);
              setSurface("admin");
            }}
          />
        )}
        {surface === "groomer" && <GroomerSurface onBackToAdmin={() => setSurface("admin")} />}
        {surface === "admin" && (
          <AdminSurface
            initialAuthenticated={true}
            onViewGroomer={() => setSurface("groomer")}
            onClientLogin={() => {
              setIsAdminAuthenticated(false);
              setSurface("portal");
            }}
            onAuthChange={setIsAdminAuthenticated}
          />
        )}
      </main>
      <SiteFooter />
      <QimmiqAssistant isAdmin={surface === "admin" && isAdminAuthenticated} />
      <PromoModal onOpenPortal={() => handleNavChange("portal")} />
    </div>
  );
}
