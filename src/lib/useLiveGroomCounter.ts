import { useState, useEffect } from "react";

// Real base number of verified pooches groomed across Toronto routes
const BASE_VERIFIED_GROOMS = 648;

export function useLiveGroomCounter(baseCount = BASE_VERIFIED_GROOMS) {
  const [count, setCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp_verified_pooches_count");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= baseCount) return parsed;
      }
    }
    return baseCount;
  });

  // Only updates when a groomer completes a stop in the groomer app
  useEffect(() => {
    const handleRealGroomRecorded = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("fp_verified_pooches_count");
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) setCount(parsed);
        }
      }
    };

    window.addEventListener("storage", handleRealGroomRecorded);
    window.addEventListener("fp_booking_completed", handleRealGroomRecorded);
    return () => {
      window.removeEventListener("storage", handleRealGroomRecorded);
      window.removeEventListener("fp_booking_completed", handleRealGroomRecorded);
    };
  }, []);

  return { count };
}

/**
 * Call this ONLY when a groom is completed (groomer app "Complete Stop"). Bookings are not grooms.
 */
export function recordRealCompletedGroom() {
  if (typeof window === "undefined") return;
  const current = parseInt(localStorage.getItem("fp_verified_pooches_count") || "648", 10);
  const next = current + 1;
  localStorage.setItem("fp_verified_pooches_count", next.toString());
  window.dispatchEvent(new Event("fp_booking_completed"));
}
