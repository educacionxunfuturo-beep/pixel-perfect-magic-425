/**
 * Fresh Pooch 2.0 — Typed API Client for Frontend
 * Connects directly to http://localhost:3001 or VITE_API_URL
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // 1. Pricing Engine
  pricing: {
    getQuote: (data: {
      breed: string;
      weightLbs: number;
      coatCondition?: string;
      serviceCode?: string;
      postalCode?: string;
      isSecondPetSibling?: boolean;
      addOns?: string[];
    }) => fetchJson<any>('/pricing/quote', { method: 'POST', body: JSON.stringify(data) }),
  },

  // 2. Service Zones & Coverage
  zones: {
    checkPostal: (postalCode: string) =>
      fetchJson<any>(`/zones/check?postalCode=${encodeURIComponent(postalCode)}`),
  },

  // 3. Booking & Scheduling Engine
  booking: {
    getSlots: (postalCode: string, dogWeightLbs?: number) =>
      fetchJson<any>(
        `/booking/slots?postalCode=${encodeURIComponent(postalCode)}${
          dogWeightLbs ? `&dogWeightLbs=${dogWeightLbs}` : ''
        }`,
      ),
    createBooking: (data: any) =>
      fetchJson<any>('/booking/reserve', { method: 'POST', body: JSON.stringify(data) }),
    getAppointments: () => fetchJson<any[]>('/booking/appointments'),
    getAppointment: (id: string) => fetchJson<any>(`/booking/appointments/${id}`),
    cancel: (id: string, reason?: string) =>
      fetchJson<any>(`/booking/appointments/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    triggerAutoFill: (id: string) =>
      fetchJson<any>(`/booking/appointments/${id}/autofill`, { method: 'POST' }),
  },

  // 4. Pets & Pooch ID
  pets: {
    getAll: () => fetchJson<any[]>('/pets'),
    getById: (id: string) => fetchJson<any>(`/pets/${id}`),
    create: (data: any) => fetchJson<any>('/pets', { method: 'POST', body: JSON.stringify(data) }),
    addVaccine: (petId: string, vaccineData: any) =>
      fetchJson<any>(`/pets/${petId}/vaccines`, {
        method: 'POST',
        body: JSON.stringify(vaccineData),
      }),
  },

  // 5. Payments & Stripe
  payments: {
    createIntent: (data: {
      appointmentId: string;
      amountCents: number;
      tipPercentage?: number;
      saveCardOnFile?: boolean;
    }) => fetchJson<any>('/payments/create-intent', { method: 'POST', body: JSON.stringify(data) }),
    chargeCancellation: (appointmentId: string, reason?: string) =>
      fetchJson<any>('/payments/charge-cancellation', {
        method: 'POST',
        body: JSON.stringify({ appointmentId, reason }),
      }),
  },

  // 6. VIP Memberships
  memberships: {
    getPlans: () => fetchJson<any[]>('/memberships/plans'),
    subscribe: (data: any) =>
      fetchJson<any>('/memberships/subscribe', { method: 'POST', body: JSON.stringify(data) }),
    getMySubscriptions: (userId: string) =>
      fetchJson<any[]>(`/memberships/my-subscriptions?userId=${userId}`),
  },

  // 7. Groomer Field Mode
  groomer: {
    getTodayRoute: () => fetchJson<any[]>('/groomer/today-route'),
    submitReportCard: (appointmentId: string, report: any) =>
      fetchJson<any>(`/groomer/appointments/${appointmentId}/report-card`, {
        method: 'POST',
        body: JSON.stringify(report),
      }),
    getReportCard: (appointmentId: string) =>
      fetchJson<any>(`/groomer/appointments/${appointmentId}/report-card`),
  },

  // 8. Qimmiq AI Brain
  qimmiq: {
    chat: (data: { message: string; mode?: 'CLIENT_CONCIERGE' | 'ADMIN_COPILOT'; postalCode?: string }) =>
      fetchJson<any>('/qimmiq/chat', { method: 'POST', body: JSON.stringify(data) }),
  },

  // 9. Calendar Feed & MoeGo Migration
  calendar: {
    getFeedUrl: () => `${API_BASE}/calendar/feed.ics`,
  },
  migration: {
    importMoeGo: (rows: any[]) =>
      fetchJson<any>('/migration/import-moego', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }),
  },
};
