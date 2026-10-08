import { useState, useEffect } from "react";
import { X, Gift, Copy, Check, MessageCircle, UserPlus, Heart } from "lucide-react";
import { Pill } from "./primitives";

export function PromoModal({ onOpenPortal }: { onOpenPortal?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the user has already seen/dismissed the promo
    const dismissed = localStorage.getItem("fp_promo_dismissed");
    if (dismissed === "true") return;

    // Trigger after 60 seconds (1 minute) of active browsing
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("fp_promo_dismissed", "true");
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("TORONTOFRESH15");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("fp_promo_email", email.trim());
      localStorage.setItem("fp_promo_dismissed", "true");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold/40 bg-card p-6 sm:p-8 shadow-2xl animate-scale-up">
        {/* Subtle luxury glow behind modal */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-teal/15 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close promotion"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <Pill tone="gold" className="mb-3 mx-auto">
            <Gift className="h-3.5 w-3.5 text-gold" /> Toronto Welcome Gift
          </Pill>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Get 15% OFF + Free Blueberry Facial
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Welcome to Toronto's premier 1-on-1 mobile dog spa! Enjoy <strong>15% savings</strong> on your first doorstep groom plus a complimentary Organic Blueberry Facial ($15 CAD Value).
          </p>
        </div>

        {/* Promo code badge with copy button */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-gold/40 bg-gold-soft/40 px-4 py-3">
          <div className="text-left">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Promo Code</span>
            <span className="font-mono text-base font-extrabold text-ink tracking-widest">TORONTOFRESH15</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-bold text-ink-foreground transition hover:opacity-90 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Form or Confirmation */}
        {!submitted ? (
          <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to save code"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-teal transition shadow-sm"
              />
              <button
                type="submit"
                className="bg-teal px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lift hover:bg-teal/90 transition shrink-0"
              >
                Send Voucher
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              We'll send the 15% voucher to your inbox. No spam ever.
            </p>
          </form>
        ) : (
          <div className="mt-5 rounded-xl bg-success-soft p-3.5 text-center text-xs text-success border border-success/30">
            <strong className="block font-bold">🎉 15% Voucher Sent!</strong>
            Check your inbox. Use code <code className="font-mono font-bold">TORONTOFRESH15</code> at checkout.
          </div>
        )}

        {/* Alternative Actions: WhatsApp or Create Account */}
        <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-2.5">
          <a
            href={`https://wa.me/16474511747?text=${encodeURIComponent("Hello The Fresh Pooch! I'd like to use promo code TORONTOFRESH15 for 15% off my first grooming booking in Toronto.")}`}
            target="_blank"
            rel="noreferrer"
            onClick={handleDismiss}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-xs font-semibold text-foreground hover:border-[#25D366] hover:bg-[#25D366]/10 transition text-center"
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
            <span>Claim via WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => {
              handleDismiss();
              if (onOpenPortal) onOpenPortal();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-gold p-2.5 text-xs font-bold text-ink shadow-sm hover:scale-[1.02] transition-transform text-center"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create Account & Save</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[11px] text-muted-foreground hover:underline"
          >
            Maybe later, I'll pay full price
          </button>
        </div>
      </div>
    </div>
  );
}
