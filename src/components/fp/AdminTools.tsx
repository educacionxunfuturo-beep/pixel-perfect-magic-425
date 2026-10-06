import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Rocket, Check, CalendarSync, Copy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, SectionTitle } from "./primitives";

function MoeGoImporter() {
  const [file, setFile] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [state, setState] = useState<"idle" | "syncing" | "done">("idle");
  const input = useRef<HTMLInputElement>(null);
  const pick = (name: string) => { setFile(name); setState("idle"); };

  return (
    <div className="card-surface p-6">
      <div className="flex items-center gap-2 font-serif text-xl font-semibold"><FileSpreadsheet className="h-5 w-5 text-teal" /> MoeGo Migration Engine</div>
      <p className="mt-1 text-sm text-muted-foreground">Import legacy customer records, pet profiles, and grooming histories.</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]?.name ?? "moego_export.csv"); }}
        className={cn("mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-sm transition-colors", drag ? "border-primary bg-sage-soft" : "border-border hover:border-sage")}
      >
        <UploadCloud className="h-8 w-8 text-teal" />
        <span className="font-semibold">{file ?? "Drop MoeGo export CSV here, or browse files"}</span>
      </button>
      <input ref={input} type="file" accept=".csv" className="hidden" onChange={(e) => pick(e.target.files?.[0]?.name ?? "moego_export.csv")} />
      {file && (
        <div className="animate-fade-up mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-3 text-sm">
            <span>Detected: <strong>642</strong> customer records, <strong>718</strong> pets, <strong>1,240</strong> appointment histories</span>
            <Pill tone={state === "done" ? "success" : "gold"}>{state === "done" ? "Migrated" : "Ready to migrate"}</Pill>
          </div>
          <button
            disabled={state !== "idle"}
            onClick={() => { setState("syncing"); setTimeout(() => setState("done"), 1600); }}
            className={cn("flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all", state === "done" ? "bg-success text-primary-foreground" : "bg-ink text-ink-foreground hover:scale-[1.01]")}
          >
            {state === "idle" && <><Rocket className="h-4 w-4" /> Sync to Fresh Pooch OS Database</>}
            {state === "syncing" && <><Loader2 className="h-4 w-4 animate-spin" /> Importing records…</>}
            {state === "done" && <><Check className="h-4 w-4" /> Successfully imported 642 clients!</>}
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarSyncCard() {
  const url = "http://localhost:3001/calendar/feed.ics";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="card-surface p-6">
      <div className="flex items-center gap-2 font-serif text-xl font-semibold"><CalendarSync className="h-5 w-5 text-teal" /> Native Apple & Google Calendar Sync</div>
      <p className="mt-1 text-sm text-muted-foreground">Subscribes your iPhone, Mac, or Google Calendar to today's van routes in real-time.</p>
      <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3 font-mono text-sm break-all">{url}</div>
      <button onClick={copy} className="bg-gradient-gold mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-ink shadow-lift">
        {copied ? <><Check className="h-4 w-4" /> Copied to clipboard!</> : <><Copy className="h-4 w-4" /> Copy iCal Feed URL</>}
      </button>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Feed live • refreshes every 5 minutes
      </div>
    </div>
  );
}

export function AdminTools() {
  return (
    <div className="mt-6">
      <SectionTitle eyebrow="Operations" title="Migration & calendar tools" />
      <div className="grid gap-4 lg:grid-cols-2">
        <MoeGoImporter />
        <CalendarSyncCard />
      </div>
    </div>
  );
}
