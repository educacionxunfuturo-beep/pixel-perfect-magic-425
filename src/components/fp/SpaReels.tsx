import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, X, Instagram, Sparkles, MapPin, Heart } from "lucide-react";
import { Pill, SectionTitle } from "./primitives";
import { cn } from "@/lib/utils";

interface ReelItem {
  id: string;
  title: string;
  badge: string;
  tag: string;
  description: string;
  videoSrc: string;
  posterSrc: string;
}

const REELS: ReelItem[] = [
  {
    id: "four-seasons",
    title: "Four Seasons Hotel Arrival",
    badge: "Yorkville Concierge",
    tag: "Mobile Freedom",
    description: "Our 100% self-sufficient mobile spa arriving at the Four Seasons Toronto courtyard. Zero cords, zero water hookups needed.",
    videoSrc: "/videos/reel-four-seasons.mp4",
    posterSrc: "/videos/thumb-four-seasons.jpg",
  },
  {
    id: "bulldog-bath",
    title: "Rocky's Soothing Hydrobath",
    badge: "Organic Oatmeal Wash",
    tag: "Zero-Stress Bathing",
    description: "Gentle warm hydrobath, blueberry facial massage, and fluffy towel dry. Pure comfort with zero cages.",
    videoSrc: "/videos/reel-bulldog-bath.mp4",
    posterSrc: "/videos/thumb-bulldog-bath.jpg",
  },
  {
    id: "pomeranian-blowout",
    title: "Milo's Fluff & Hand Dry",
    badge: "1-on-1 Gentle Styling",
    tag: "No Cage Dryers Ever",
    description: "High-velocity warm hand blow-dry and gentle scissor shaping inside our climate-controlled trailer.",
    videoSrc: "/videos/reel-pomeranian-blowout.mp4",
    posterSrc: "/videos/thumb-pomeranian-blowout.jpg",
  },
  {
    id: "groomer-bandana",
    title: "Fresh Pooch Bandana & Smiles",
    badge: "The Signature Finish",
    tag: "Reunion Joy",
    description: "Electric hydraulic table lower, signature tropical bandana tie, and a happy pooch ready for cuddles in under 75 mins.",
    videoSrc: "/videos/reel-groomer-bandana.mp4",
    posterSrc: "/videos/thumb-groomer-bandana.jpg",
  },
];

function ReelCard({
  reel,
  onOpenModal,
}: {
  reel: ReelItem;
  onOpenModal: (reel: ReelItem) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isBlowout = reel.id === "pomeranian-blowout";

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isBlowout) {
      const v = e.currentTarget;
      if (v.currentTime >= 21 || v.currentTime < 14) {
        v.currentTime = 14;
      }
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isBlowout) {
      e.currentTarget.currentTime = 14;
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (isBlowout && (videoRef.current.currentTime < 14 || videoRef.current.currentTime >= 21)) {
        videoRef.current.currentTime = 14;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!isPlaying) {
      if (isBlowout && (videoRef.current.currentTime < 14 || videoRef.current.currentTime >= 21)) {
        videoRef.current.currentTime = 14;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div
      onClick={() => onOpenModal(reel)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      {/* 9:16 Video Container */}
      <div className="relative aspect-[9/15] w-full overflow-hidden bg-black/40">
        <video
          ref={videoRef}
          src={`${reel.videoSrc}${isBlowout ? "#t=14,21" : ""}`}
          poster={reel.posterSrc}
          playsInline
          loop
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          preload="metadata"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between pointer-events-none">
          <Pill tone="gold" className="bg-card/90 backdrop-blur text-[11px] font-bold">
            <Sparkles className="h-3 w-3 text-gold" /> {reel.badge}
          </Pill>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/90 backdrop-blur">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Center Play Overlay when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
            <div className="flex h-13 w-13 items-center justify-center rounded-full bg-card/90 text-teal shadow-lift backdrop-blur transition-transform group-hover:scale-110">
              <Play className="ml-0.5 h-6 w-6 fill-current text-teal" />
            </div>
          </div>
        )}

        {/* Bottom Video Controls and Details */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gold flex items-center gap-1">
              <Heart className="h-3 w-3 fill-current" /> {reel.tag}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/40 transition-colors"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5 fill-current" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/40 transition-colors"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <h3 className="font-serif text-base font-semibold leading-snug line-clamp-1">{reel.title}</h3>
          <p className="mt-1 text-xs text-white/80 line-clamp-2 leading-relaxed">{reel.description}</p>
        </div>
      </div>
    </div>
  );
}

export function SpaReels() {
  const [activeModalReel, setActiveModalReel] = useState<ReelItem | null>(null);
  const [modalMuted, setModalMuted] = useState(false);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Lock background scroll when story modal is open so page doesn't shift
  useEffect(() => {
    if (activeModalReel) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [activeModalReel]);

  // Handle exact 7s clip for Milo blowout (second 14 to 21)
  useEffect(() => {
    if (activeModalReel?.id === "pomeranian-blowout" && modalVideoRef.current) {
      modalVideoRef.current.currentTime = 14;
    }
  }, [activeModalReel]);

  const handleModalTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (activeModalReel?.id === "pomeranian-blowout") {
      const v = e.currentTarget;
      if (v.currentTime >= 21 || v.currentTime < 14) {
        v.currentTime = 14;
      }
    }
  };

  const handleModalLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (activeModalReel?.id === "pomeranian-blowout") {
      e.currentTarget.currentTime = 14;
    }
  };

  return (
    <section className="border-t border-border bg-card/40 py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <SectionTitle
              eyebrow="The Mobile Spa In Motion"
              title="Real Stories Across Toronto"
              sub="Authentic behind-the-scenes moments from our routes in Yorkville, Midtown, and the Annex."
            />
          </div>
          <a
            href="https://instagram.com/thefreshpooch"
            target="_blank"
            rel="noreferrer"
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-teal/30 bg-card px-4 py-2 text-xs font-bold text-teal hover:bg-teal hover:text-white transition-colors shadow-sm"
          >
            <Instagram className="h-3.5 w-3.5" /> Follow @thefreshpooch
          </a>
        </div>

        {/* 4 Video Reels Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REELS.map((reel) => (
            <ReelCard key={reel.id} reel={reel} onOpenModal={(r) => setActiveModalReel(r)} />
          ))}
        </div>

        {/* Trust Highlight Banner below reels */}
        <div className="mt-10 rounded-2xl border border-border bg-secondary/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-lg font-semibold text-ink">Zero Commute. Zero Separation Anxiety.</div>
              <p className="text-xs text-muted-foreground">We come directly to your driveway, townhouse, or condo visitor loop.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-teal">
            <span>✓ 100% Cage-Free</span>
            <span>✓ Silent Onboard Generator</span>
            <span>✓ Heated Water Tanks</span>
          </div>
        </div>
      </div>

      {/* Story / Modal Viewer — Viewport-Bounded & Seamless Overlay */}
      {activeModalReel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
          onClick={() => setActiveModalReel(null)}
        >
          {/* Modal Container: Height-constrained to 82vh so it NEVER overflows the screen */}
          <div
            className="relative flex flex-col justify-end h-[82vh] max-h-[640px] aspect-[9/16] w-auto max-w-[92vw] overflow-hidden rounded-3xl bg-black border border-white/20 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button — Pinned and Always Visible */}
            <button
              onClick={() => setActiveModalReel(null)}
              aria-label="Close story"
              className="absolute right-3.5 top-3.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black/95 transition shadow-lg border border-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Top Mute / Unmute Button */}
            <button
              onClick={() => setModalMuted(!modalMuted)}
              aria-label={modalMuted ? "Unmute audio" : "Mute audio"}
              className="absolute left-3.5 top-3.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black/95 transition shadow-lg border border-white/20"
            >
              {modalMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Full-bleed video inside the container */}
            <video
              ref={modalVideoRef}
              src={`${activeModalReel.videoSrc}${activeModalReel.id === "pomeranian-blowout" ? "#t=14,21" : ""}`}
              poster={activeModalReel.posterSrc}
              autoPlay
              playsInline
              loop
              muted={modalMuted}
              onTimeUpdate={handleModalTimeUpdate}
              onLoadedMetadata={handleModalLoadedMetadata}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Sleek Overlay Details at Bottom (TikTok & Instagram Reels Style) */}
            <div className="relative z-20 p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-white pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded-full bg-gold/90 text-ink text-[10px] font-bold px-2 py-0.5 shadow-sm">
                  {activeModalReel.badge}
                </span>
                <span className="text-xs text-white/80 font-semibold">{activeModalReel.tag}</span>
                {activeModalReel.id === "pomeranian-blowout" && (
                  <span className="rounded-full bg-white/20 text-white text-[10px] font-mono px-2 py-0.5">
                    7s Clip (14s–21s)
                  </span>
                )}
              </div>
              <h4 className="font-serif text-lg font-bold leading-tight">{activeModalReel.title}</h4>
              <p className="mt-1 text-xs text-white/85 line-clamp-2 leading-relaxed">{activeModalReel.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
