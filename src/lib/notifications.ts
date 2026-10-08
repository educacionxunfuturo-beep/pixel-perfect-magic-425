// Notification System for The Fresh Pooch (Toronto Mobile Spa)
// Supports: WhatsApp Direct Links (100% Free), Twilio SMS & Webhook, and Transactional Email (Resend/SendGrid)

export type NotificationChannel = "sms" | "whatsapp" | "email";

export type NotificationType =
  | "10_min_alert"
  | "report_card"
  | "reminder_48h"
  | "reminder_24h"
  | "booking_confirmed";

export interface NotificationPayload {
  toPhone: string;
  toEmail?: string;
  clientName: string;
  dogName: string;
  appointmentTime?: string;
  address?: string;
  latchkeyPin?: string;
  reportCardUrl?: string;
  photoUrl?: string;
}

export interface DispatchResult {
  success: boolean;
  channel: NotificationChannel;
  message: string;
  whatsappUrl?: string;
  timestamp: string;
  costEstimateCad: string;
  /** True when nothing was actually sent (provider not configured): the UI must say so. */
  simulated?: boolean;
}

// Clean Canadian phone number to E.164 (+1XXXXXXXXXX)
export function formatCanadianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+1${digits}`;
}

export function buildNotificationMessage(type: NotificationType, data: NotificationPayload): string {
  switch (type) {
    case "10_min_alert":
      return `🚐 The Fresh Pooch Alert: Our luxury mobile spa trailer is 10 minutes away from ${data.address || "your address"}! Please have ${data.dogName} ready for their 1-on-1 stress-free groom. 🐾`;

    case "report_card":
      return `✨ Fresh & Fluffy! ${data.dogName}'s mobile grooming session is complete. View their official digital Pooch Report Card & photos here: ${data.reportCardUrl || "https://doggroomingtoronto.ca/portal"} 🐶`;

    case "reminder_48h":
      return `⏰ The Fresh Pooch: ${data.dogName}'s appointment is scheduled in 48 hours (${data.appointmentTime || "Upcoming"}). 1-on-1 cage-free care right outside your door. Need to adjust? Visit your Customer Portal.`;

    case "reminder_24h":
      return `🐾 See you tomorrow! Van #1 route is locked for ${data.dogName} at ${data.appointmentTime || "scheduled time"}. Our groomer has encrypted latchkey access ready if you are away.`;

    case "booking_confirmed":
      return `🎉 Booking Confirmed! We've held your mobile grooming slot for ${data.dogName} on ${data.appointmentTime || "selected date"}. Organic hydrobath & cage-free spa guaranteed.`;

    default:
      return `The Fresh Pooch Toronto: Update for ${data.dogName}.`;
  }
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanNumber = phone.replace(/\D/g, "");
  const formatted = cleanNumber.length === 10 ? `1${cleanNumber}` : cleanNumber;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

export async function dispatchNotification(
  type: NotificationType,
  channel: NotificationChannel,
  data: NotificationPayload
): Promise<DispatchResult> {
  const message = buildNotificationMessage(type, data);
  const formattedPhone = formatCanadianPhone(data.toPhone);
  const now = new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });

  if (channel === "whatsapp") {
    const waUrl = generateWhatsAppLink(formattedPhone, message);
    return {
      success: true,
      channel: "whatsapp",
      message,
      whatsappUrl: waUrl,
      timestamp: now,
      costEstimateCad: "$0.00 CAD (100% Free via WhatsApp Web/App)",
    };
  }

  if (channel === "email") {
    // No email provider is connected yet: report it instead of pretending the email went out.
    return {
      success: false,
      simulated: true,
      channel: "email",
      message,
      timestamp: now,
      costEstimateCad: "Email sending is not set up yet",
    };
  }

  // SMS goes through the server (src/lib/server-api.ts), which holds the Twilio credentials.
  try {
    const res = await fetch("/api/notifications/sms", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: formattedPhone, body: message }),
    });
    const result = (await res.json().catch(() => ({}))) as { sent?: boolean; error?: string };
    if (res.ok && result.sent) {
      return { success: true, channel: "sms", message, timestamp: now, costEstimateCad: "$0.01 CAD (~$0.0079 USD per Canadian SMS)" };
    }
    return {
      success: false,
      simulated: true,
      channel: "sms",
      message,
      timestamp: now,
      costEstimateCad: res.status === 501 ? "Demo: Twilio is not configured, no SMS was sent" : result.error ?? "SMS could not be sent",
    };
  } catch {
    return { success: false, simulated: true, channel: "sms", message, timestamp: now, costEstimateCad: "SMS could not be sent (offline)" };
  }
}
