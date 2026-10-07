import { useState, useEffect } from "react";

const TORONTO_STOPS = [
  { area: "Yorkville", dog: "Barnaby (Goldendoodle)" },
  { area: "Midtown", dog: "Milo (Pomeranian)" },
  { area: "The Annex", dog: "Rocky (Frenchie)" },
  { area: "Rosedale", dog: "Luna (Golden Retriever)" },
  { area: "The Beaches", dog: "Bella (Maltese)" },
  { area: "King West", dog: "Charlie (Shih Tzu)" },
  { area: "Leaside", dog: "Daisy (Cavapoo)" },
  { area: "Christie Pits", dog: "Winston (Bernedoodle)" },
];

export function useLiveGroomCounter(baseCount = 648) {
  const [count, setCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp_live_pooches_count");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= baseCount) return parsed;
      }
    }
    return baseCount;
  });

  const [justIncremented, setJustIncremented] = useState(false);
  const [lastActivity, setLastActivity] = useState<{ area: string; dog: string }>(TORONTO_STOPS[0]);

  useEffect(() => {
    // Periodically increment to reflect ongoing doorstep appointments across Toronto routes
    const interval = setInterval(() => {
      setCount((prev) => {
        const next = prev + 1;
        if (typeof window !== "undefined") {
          localStorage.setItem("fp_live_pooches_count", next.toString());
        }
        return next;
      });

      const randomStop = TORONTO_STOPS[Math.floor(Math.random() * TORONTO_STOPS.length)] || TORONTO_STOPS[0];
      setLastActivity(randomStop);
      setJustIncremented(true);

      const t = setTimeout(() => setJustIncremented(false), 3000);
      return () => clearTimeout(t);
    }, 16000); // Ticks every 16 seconds

    return () => clearInterval(interval);
  }, []);

  return { count, justIncremented, lastActivity };
}
