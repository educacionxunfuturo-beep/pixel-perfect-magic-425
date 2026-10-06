import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type Mode = "client" | "admin";
type Msg = { from: "user" | "ai"; text: string };

const PROMPTS = [
  "What's the price for a 30lb Goldendoodle?",
  "How does Latchkey service work?",
  "How much freshwater is left in Van #1?",
  "Explain our 50% late cancellation policy",
];

function reply(q: string, mode: Mode): string {
  const s = q.toLowerCase();
  if (s.includes("doodle") || s.includes("price") || s.includes("cost"))
    return "A 30lb Goldendoodle falls in our Medium tier. The Premium Full Groom (Teddy Bear Cut) usually lands around $175–$185 CAD with organic shampoo, hand blow-dry and nail buffing. Doodles do best on a 6-week schedule to prevent matting.";
  if (s.includes("latchkey"))
    return "Latchkey service lets you stay at work: you share a lockbox or door code securely, our groomer collects your pup, grooms them 1-on-1 in the trailer, returns them home and sends you a photo report card. Codes are only revealed to the groomer on the day.";
  if (s.includes("water") || s.includes("van") || s.includes("tank"))
    return mode === "admin"
      ? "Van #1 freshwater tank: 68% (≈ 82 L). That covers about 4 more medium grooms. Suggest refilling after the 2:30 PM Rosedale stop."
      : "Our trailer is 100% self-sufficient — we carry our own heated fresh water and silent power, so we never need your hose or outlets.";
  if (s.includes("cancel"))
    return "We send reminders at 48h and 24h. Cancellations with less than 24h notice incur a 50% fee, because that slot can rarely be refilled on a route day. Severe Toronto winter storms? We reschedule with zero penalty.";
  if (mode === "admin" && (s.includes("revenue") || s.includes("today")))
    return "Today: 6 grooms booked, $1,040 CAD projected revenue, 1 open slot on the Annex route at 3:45 PM. Want me to offer it to the waitlist?";
  if (mode === "admin" && s.includes("reschedule"))
    return "Done — I've drafted SMS reschedule offers for the 2 afternoon Beaches clients. Send them from the Groomer view.";
  return mode === "admin"
    ? "I can show revenue, van tank levels, route density, or draft reschedules. What do you need?"
    : "Happy to help! I can explain pricing, breed grooming intervals, our organic products, or how booking works.";
}

export function QimmiqAssistant() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("client");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "Hi! I'm Qimmiq, your Fresh Pooch concierge. Ask me about prices, services or bookings 🐾" },
  ]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

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
      <button onClick={() => setOpen(true)} className={cn("bg-gradient-teal fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-primary-foreground shadow-lift transition-transform hover:scale-105", open && "hidden")}>
        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative h-2.5 w-2.5 rounded-full bg-success" /></span>
        <Sparkles className="h-4 w-4 text-gold" /> Ask Qimmiq AI
      </button>

      {open && <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-lift transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")} aria-hidden={!open}>
        <div className="bg-gradient-teal trailer-rivets p-5 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow text-gold">Qimmiq AI</div>
              <h3 className="text-lg font-semibold leading-tight">Fresh Pooch Concierge & Copilot</h3>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-primary-foreground/15"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 inline-flex rounded-full bg-primary-foreground/15 p-1 text-xs font-semibold">
            {(["client", "admin"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cn("rounded-full px-3 py-1.5 transition-colors", mode === m ? "bg-gold text-ink" : "opacity-80")}>
                {m === "client" ? "Client Concierge" : "Admin Copilot"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.from === "user" ? "ml-auto bg-ink text-ink-foreground" : "bg-card border border-border")}>{m.text}</div>
          ))}
          {typing && <div className="w-16 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">…</div>}
          <div ref={end} />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-sage hover:bg-sage-soft">{p}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Qimmiq anything…" className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring" />
            <button type="submit" aria-label="Send" className="bg-gradient-gold rounded-full p-3 text-ink"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      </aside>
    </>
  );
}
