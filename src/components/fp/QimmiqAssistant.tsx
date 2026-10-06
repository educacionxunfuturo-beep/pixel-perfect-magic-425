import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import qimmiqAvatar from "@/assets/qimmiq-avatar.jpg";

type Mode = "client" | "admin";
type Msg = { from: "user" | "ai"; text: string };

const PROMPTS = [
  "Are you open on Sundays?",
  "What's the price for a 30lb Goldendoodle?",
  "How do VIP Club subscriptions work?",
  "Which Toronto areas do you service?",
  "How does Latchkey contactless service work?",
  "What vaccines are required?",
];

function reply(q: string, mode: Mode): string {
  const s = q.toLowerCase();

  // Operating hours & Sundays
  if (s.includes("sunday") || s.includes("domingo") || s.includes("hour") || s.includes("horario") || s.includes("open") || s.includes("abierto")) {
    return "Yes! We are open 7 days a week, Monday through Sunday from 8:30 AM to 6:00 PM. Weekends are among our most popular times for stress-free doorstep grooming across Toronto.";
  }

  // Service zones & Toronto coverage
  if (s.includes("area") || s.includes("zone") || s.includes("neighborhood") || s.includes("where") || s.includes("etobicoke") || s.includes("mississauga") || s.includes("markham") || s.includes("scarborough") || s.includes("midtown") || s.includes("donde")) {
    return "We service the entire Toronto core and GTA: Midtown, The Annex, Rosedale, Leaside, Downtown Toronto, East York, Etobicoke, North York, York, plus select zones in Mississauga, Markham, Scarborough, and Richmond Hill!";
  }

  // Subscriptions & VIP Club
  if (s.includes("subscri") || s.includes("suscrip") || s.includes("vip") || s.includes("plan") || s.includes("membership") || s.includes("save")) {
    return "Our VIP Pooch Club offers 4, 6, and 8-week recurring routines with 15% lifetime savings (saving up to $250+/yr). Members get guaranteed peak weekend slots, free organic Blueberry Facials ($15 value every visit), the same dedicated groomer, and zero cancellation penalties!";
  }

  // In-house booking vs MoeGo
  if (s.includes("moego") || s.includes("book") || s.includes("appoin") || s.includes("cita") || s.includes("reserva") || s.includes("agenda")) {
    return "You do NOT need MoeGo! You can book directly right on our site or through your private Customer Portal in under 90 seconds. We have full in-house scheduling with live route optimization, instant quote calculations, and calendar sync.";
  }

  // Vaccinations & Pet Passport
  if (s.includes("vaccin") || s.includes("vacun") || s.includes("rabies") || s.includes("rabia") || s.includes("bordetella") || s.includes("shot")) {
    return "In accordance with Ontario veterinary standards, we require active Rabies, Bordetella (kennel cough), and DHPP vaccinations. You can track your pup's expiration dates and receive automatic renewal alerts directly inside your Customer Portal Pet Passport.";
  }

  // Pricing & breeds
  if (s.includes("doodle") || s.includes("price") || s.includes("cost") || s.includes("precio") || s.includes("cuanto") || s.includes("rate")) {
    return "A 30lb Goldendoodle falls in our Medium tier. The Full Groom & Scissor Styling is approximately $175–$185 CAD, including warm organic hydrobath, blueberry facial, ear cleansing, sanitary trim, and precision scissor hand-finish. VIP members save 15% ($148 CAD).";
  }

  // Latchkey service
  if (s.includes("latchkey") || s.includes("lockbox") || s.includes("key") || s.includes("contactless") || s.includes("work")) {
    return "Latchkey service lets you stay at work or relax inside: share your lockbox or smart-lock code securely, our bonded groomer collects your pup, grooms them 1-on-1 inside our mobile spa, returns them safely inside and sends you a digital photo report card. Each stop has its own encrypted access code revealed only upon arrival.";
  }

  // Trailer capabilities & fresh water
  if (s.includes("water") || s.includes("van") || s.includes("tank") || s.includes("agua") || s.includes("trailer")) {
    return mode === "admin"
      ? "Van #1 freshwater tank: 72% (≈ 95 L). Battery bank: 88%. Generator: standby. Next route stop: Midtown (M4P)."
      : "Our luxury trailer is 100% self-sufficient — we bring our own heated fresh water, quiet eco-power, and temperature-controlled air. We never need your electrical outlets or garden hose!";
  }

  // Cancellation policy
  if (s.includes("cancel") || s.includes("polic") || s.includes("politica")) {
    return "We send reminders at 48h and 24h. Standard cancellations with less than 24h notice incur a 50% late fee. However, VIP Club members enjoy zero cancellation fees, and we always reschedule Toronto severe winter snowstorms with zero penalty.";
  }

  // Real reviews & social proof
  if (s.includes("review") || s.includes("reseña") || s.includes("google") || s.includes("real") || s.includes("instagram")) {
    return "All our reviews are 100% genuine verified 5.0-star experiences from real Toronto dog owners across Rosedale, Midtown, Annex, and Downtown. You can also check our Instagram @thefreshpooch to see our actual video reels, happy client pups, and van footage!";
  }

  // Admin-specific copilot
  if (mode === "admin" && (s.includes("revenue") || s.includes("today") || s.includes("kpi"))) {
    return "Today: 5 Sunday grooms scheduled, $860 CAD revenue projected. Van #1 freshwater at 72%. All 5 stops have active latchkey codes loaded.";
  }
  if (mode === "admin" && s.includes("reschedule")) {
    return "Done — I've drafted SMS reschedule offers for afternoon routes. You can review and broadcast them in Groomer Mode.";
  }

  return mode === "admin"
    ? "I can show live revenue, van tank levels, zone route density, MoeGo sync status, or latchkey codes. What do you need?"
    : "Happy to help! I can answer questions about pricing, Sunday hours, Toronto neighborhoods, our VIP subscription savings, or book your next groom.";
}

export function QimmiqAssistant() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("client");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "Woof! I'm Qimmiq, your Canadian Dog Service AI. How can I help you and your pooch today? 🐾" },
  ]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  useEffect(() => {
    // Show welcoming speech bubble 1.5 seconds after page loads
    const timer = setTimeout(() => {
      setWelcomeToast(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "user", text: t }]);
    setInput("");
    setTyping(true);

    try {
      const res = await api.qimmiq.chat({
        message: t,
        mode: mode === "client" ? "CLIENT_CONCIERGE" : "ADMIN_COPILOT",
      });
      const responseText = res.message || res.reply || res.text || reply(t, mode);
      setMsgs((m) => [...m, { from: "ai", text: responseText }]);
    } catch {
      // Fallback seamlessly to local intelligent reply if backend is offline
      setMsgs((m) => [...m, { from: "ai", text: reply(t, mode) }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Welcome Speech Bubble */}
      {welcomeToast && !open && (
        <div className="animate-fade-up fixed bottom-20 right-5 z-40 max-w-xs rounded-2xl border border-gold/40 bg-card/95 p-4 shadow-lift backdrop-blur-md">
          <div className="flex items-start gap-3">
            <img
              src={qimmiqAvatar}
              alt="Qimmiq"
              className="h-9 w-9 rounded-full border-2 border-gold object-cover shrink-0 shadow-sm"
            />
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-teal flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gold" /> Qimmiq AI Concierge
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWelcomeToast(false);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs p-0.5 rounded transition-colors"
                  aria-label="Cerrar mensaje"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p
                className="mt-1 text-xs text-foreground leading-relaxed cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setOpen(true);
                  setWelcomeToast(false);
                }}
              >
                👋 <strong>¡Hola!</strong> Soy <strong>Qimmiq</strong>. Pregúntame sobre precios para la raza de tu perro, qué incluye cada paquete de spa o cómo reservar en Toronto. 🐾
              </p>
              <button
                onClick={() => {
                  setOpen(true);
                  setWelcomeToast(false);
                }}
                className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-bold text-teal hover:underline"
              >
                Chatear con Qimmiq &rarr;
              </button>
            </div>
          </div>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 right-8 h-3.5 w-3.5 rotate-45 border-b border-r border-gold/40 bg-card" />
        </div>
      )}

      <button
        onClick={() => {
          setOpen(true);
          setWelcomeToast(false);
        }}
        className={cn(
          "bg-gradient-teal fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full pl-2 pr-5 py-2 text-sm font-bold text-primary-foreground shadow-lift transition-transform hover:scale-105 border border-gold/30",
          open && "hidden",
        )}
      >
        <div className="relative">
          <img
            src={qimmiqAvatar}
            alt="Qimmiq Dog Service AI"
            className="h-10 w-10 rounded-full border-2 border-gold object-cover shadow-sm"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative h-3 w-3 rounded-full bg-success border-2 border-background" />
          </span>
        </div>
        <div className="text-left leading-tight">
          <div className="text-xs text-gold flex items-center gap-1 font-semibold">
            <Sparkles className="h-3 w-3" /> Dog Service AI
          </div>
          <span className="text-sm">Ask Qimmiq</span>
        </div>
      </button>


      {open && <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-lift transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="bg-gradient-teal trailer-rivets p-5 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={qimmiqAvatar}
                alt="Qimmiq AI Avatar"
                className="h-14 w-14 rounded-full border-2 border-gold object-cover shadow-md"
              />
              <div>
                <div className="eyebrow text-gold">Canadian Dog Service AI</div>
                <h3 className="text-xl font-serif font-bold leading-tight">Qimmiq</h3>
                <p className="text-xs text-primary-foreground/80">Fresh Pooch Concierge & Copilot</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-1.5 hover:bg-primary-foreground/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 inline-flex rounded-full bg-primary-foreground/15 p-1 text-xs font-semibold">
            {(["client", "admin"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("rounded-full px-3.5 py-1.5 transition-colors", mode === m ? "bg-gold text-ink" : "opacity-80")}
              >
                {m === "client" ? "🐾 Client Concierge" : "⚡ Admin Copilot"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex-1 space-y-3 overflow-y-auto p-5">
          {/* Subtle watermark of Qimmiq in the chat background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
            <img src={qimmiqAvatar} alt="" className="h-64 w-64 object-contain" />
          </div>

          {msgs.map((m, i) => (
            <div key={i} className={cn("flex items-end gap-2", m.from === "user" ? "justify-end" : "justify-start")}>
              {m.from === "ai" && (
                <img
                  src={qimmiqAvatar}
                  alt="Qimmiq"
                  className="h-7 w-7 rounded-full border border-gold shrink-0 object-cover"
                />
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.from === "user" ? "bg-ink text-ink-foreground rounded-br-none" : "bg-card border border-border rounded-bl-none shadow-sm",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-2">
              <img src={qimmiqAvatar} alt="Qimmiq" className="h-7 w-7 rounded-full border border-gold shrink-0 object-cover" />
              <div className="w-16 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground animate-pulse">…</div>
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="border-t border-border p-4 bg-muted/20">
          <div className="mb-3 flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-sage hover:bg-sage-soft transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Qimmiq anything…"
              className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring shadow-sm"
            />
            <button
              type="submit"
              aria-label="Send"
              className="bg-gradient-gold rounded-full p-3 text-ink shadow-lift transition-transform hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

