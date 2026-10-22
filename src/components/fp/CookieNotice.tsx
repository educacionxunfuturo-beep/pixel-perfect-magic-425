import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

// Bump the version when the policy changes in a way visitors should see again.
const KEY = "fp_privacy_notice";
const VERSION = "2026-10-22";
export const PRIVACY_ACCEPTED_EVENT = "fp-privacy-accepted";

export function privacyNoticeAccepted(): boolean {
  try {
    return localStorage.getItem(KEY) === VERSION;
  } catch {
    return false;
  }
}

/**
 * First-visit notice. The app uses only essential cookies and local storage (no advertising or
 * analytics), so it informs and asks the visitor to accept the Privacy Policy, as PIPEDA expects.
 */
export function CookieNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(!privacyNoticeAccepted());
  }, []);
  if (!open) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, VERSION);
    } catch {
      // storage blocked: the notice comes back on the next visit
    }
    setOpen(false);
    window.dispatchEvent(new Event(PRIVACY_ACCEPTED_EVENT));
  };

  return (
    <div role="dialog" aria-live="polite" aria-label="Privacy and cookies" className="animate-fade-up fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-aqua/30 bg-card/97 p-4 shadow-lift backdrop-blur-md sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aqua-soft text-teal">
            <Cookie className="h-5 w-5" />
          </div>
          <p className="text-sm text-foreground/85">
            <strong className="text-ink">Your privacy matters.</strong> We use only essential cookies and local storage to keep you signed in and remember your booking. No advertising or tracking cookies. By continuing, you accept our{" "}
            <a href="/privacy" className="font-semibold text-teal underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <button onClick={accept} className="flex-1 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-ink-foreground transition hover:opacity-90">
            Accept
          </button>
          <a href="/privacy#cookies" className="flex-1 rounded-full border border-border px-6 py-2.5 text-center text-xs font-semibold text-muted-foreground hover:border-teal hover:text-teal">
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
}
