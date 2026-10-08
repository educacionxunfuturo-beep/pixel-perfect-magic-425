import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, KeyRound, PawPrint, Send, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "./primitives";

interface StaffNotification {
  id: number;
  kind: "booking" | "password" | "test";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

type DeviceState = "checking" | "unsupported" | "needs-home-screen" | "off" | "on" | "blocked";

function keyBytes(base64url: string): ArrayBuffer {
  const b64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((base64url.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iPhone / iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/Macintosh/.test(ua)) return "Mac";
  return "Browser";
}

function isIosOutsideHomeScreen(): boolean {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};

/**
 * Phone and desktop alerts for staff (Web Push, no extra app) and the alert history.
 * Each device turns them on once; alerts arrive even with the app closed.
 */
export function StaffAlerts() {
  const [state, setState] = useState<DeviceState>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<StaffNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [devices, setDevices] = useState(0);

  const load = useCallback(() => {
    fetch("/api/staff/notifications", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { notifications: StaffNotification[]; unread: number; devices: number } | null) => {
        if (!d) return;
        setItems(d.notifications);
        setUnread(d.unread);
        setDevices(d.devices);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(() => document.visibilityState === "visible" && load(), 30_000);
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setState(isIosOutsideHomeScreen() ? "needs-home-screen" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub && Notification.permission === "granted" ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  const turnOn = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const keyRes = await fetch("/api/push/key", { credentials: "same-origin" });
      const { publicKey } = (await keyRes.json()) as { publicKey: string | null };
      if (!publicKey) throw new Error("Alerts are not set up on the server yet.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub.toJSON(), label: deviceLabel() }),
      });
      if (!res.ok) throw new Error("Could not save this device. Please try again.");
      setState("on");
      setMessage("Alerts are on for this device. Send a test to check.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not turn on alerts.");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
      setMessage("Alerts are off for this device.");
      load();
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST", credentials: "same-origin" });
      const d = (await res.json()) as { sent?: number; devices?: number };
      setMessage(d.devices ? `Test sent to ${d.sent} of ${d.devices} device${d.devices === 1 ? "" : "s"}.` : "No device has alerts on yet.");
      load();
    } finally {
      setBusy(false);
    }
  };

  const markRead = async () => {
    await fetch("/api/staff/notifications", { method: "POST", credentials: "same-origin" });
    load();
  };

  return (
    <div className="card-surface mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <Bell className="h-5 w-5 text-gold" /> Alerts
          {unread > 0 && <Pill tone="gold">{unread} new</Pill>}
        </h2>
        <Pill tone="muted">{devices === 1 ? "1 device receives alerts" : `${devices} devices receive alerts`}</Pill>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3 text-sm">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
            <div>
              <div className="font-semibold">
                {state === "on" ? "This device gets an alert for every new booking and password request." : "Get an alert on this phone or computer, even with the app closed."}
              </div>
              <div className="text-xs text-muted-foreground">
                {state === "needs-home-screen" && "On iPhone: tap Share, then “Add to Home Screen”. Open The Fresh Pooch from the home screen, sign in and turn alerts on there."}
                {state === "unsupported" && "This browser can't receive alerts. Use Chrome, Edge, Firefox or Safari (on iPhone, from the home screen)."}
                {state === "blocked" && "Alerts are blocked for this site. Allow notifications in the browser's site settings, then try again."}
                {(state === "off" || state === "on" || state === "checking") && "Each person turns them on once on their own phone or computer. No extra app needed."}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {state === "off" && (
              <button disabled={busy} onClick={turnOn} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-ink-foreground disabled:opacity-50">
                <Bell className="h-3.5 w-3.5" /> Turn on alerts on this device
              </button>
            )}
            {state === "on" && (
              <>
                <button disabled={busy} onClick={sendTest} className="flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  <Send className="h-3.5 w-3.5" /> Send a test alert
                </button>
                <button disabled={busy} onClick={turnOff} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold">
                  <BellOff className="h-3.5 w-3.5" /> Turn off here
                </button>
              </>
            )}
          </div>
        </div>
        {message && <p className="mt-3 text-xs font-semibold text-teal">{message}</p>}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">History</h3>
          {unread > 0 && (
            <button onClick={markRead} className="text-xs font-semibold text-teal hover:underline">Mark all as read</button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No alerts yet. New booking requests and password requests will be listed here.</p>
        ) : (
          <ul className="mt-2 max-h-72 divide-y divide-border overflow-y-auto">
            {items.map((n) => {
              const Icon = n.kind === "password" ? KeyRound : n.kind === "test" ? Bell : PawPrint;
              return (
                <li key={n.id} className={cn("flex gap-3 py-2.5 text-sm", !n.read && "font-medium")}>
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", n.read ? "text-muted-foreground" : "text-gold")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span>{n.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{n.body}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
