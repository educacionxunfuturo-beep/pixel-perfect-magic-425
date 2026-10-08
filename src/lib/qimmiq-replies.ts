import { ADDONS, COATS, SERVICES, SERVICE_IDS, WEIGHT_TIERS, WELCOME_CODE, formatRange, priceRange, quote, type ServiceId, type WeightTierId } from "./pricing";
import { ROUTE_DAYS, addDays, formatDate, routeForDate, serviceName, torontoToday, weekdayIndex, type Appointment } from "./appointments";
import { monthKpis, upcomingBookings, zoneCoverage } from "./dashboard-stats";

/**
 * Qimmiq replies that quote prices or report business data. Prices come from
 * the shared price list (src/lib/pricing.ts) and owner figures from the
 * appointment store, so the chat always matches the website and the dashboard.
 */

export type ReplyLang = "en" | "es";

export interface ReplyCard {
  id: string;
  name: string;
  price: number;
  category: "package" | "addon";
  icon?: string;
  badge?: string;
  highlights?: string;
  breed?: string;
}

export interface Reply {
  text: string;
  actionItems?: ReplyCard[];
}

export interface ReplyEntities {
  breed?: string;
  breedTier?: "small" | "medium" | "large" | "giant";
  location?: string;
}

const T = (lang: ReplyLang, en: string, es: string) => (lang === "es" ? es : en);

const TIER: Record<NonNullable<ReplyEntities["breedTier"]>, WeightTierId> = { small: "s", medium: "m", large: "l", giant: "g" };

const CARD_COPY: Record<ServiceId, { icon: string; badge: [string, string]; highlights: [string, string] }> = {
  tidy: { icon: "🛁", badge: ["No haircut", "Sin corte"], highlights: ["Warm hydrobath, hand dry, nails & ears", "Hidrobaño tibio, secado a mano, uñas y oídos"] },
  full: { icon: "✂️", badge: ["Most popular", "El más pedido"], highlights: ["Full breed haircut, bath & nails", "Corte completo de raza, baño y uñas"] },
  ultimate: { icon: "✨", badge: ["Full luxury", "Lujo total"], highlights: ["Haircut, teeth, glands, facial & pad care", "Corte, dientes, glándulas, facial y almohadillas"] },
};

const FACIAL = ADDONS.find((a) => a.id === "facial")!;
const SALT = ADDONS.find((a) => a.id === "salt")!;
const LIGHT_MAT = COATS.find((c) => c.id === "light")!.add;
const SEVERE_MAT = COATS.find((c) => c.id === "severe")!.add;

function tierOf(e: ReplyEntities): WeightTierId | undefined {
  return e.breedTier ? TIER[e.breedTier] : undefined;
}

/** Exact base price when breed and size are known, otherwise the range for the size (or for all sizes). */
function servicePrice(service: ServiceId, e: ReplyEntities): { label: string; value: number } {
  const tier = tierOf(e);
  if (tier && e.breed) {
    const base = quote({ service, tier, breed: e.breed }).base;
    return { label: `$${base}`, value: base };
  }
  const range = priceRange(service, tier);
  return { label: formatRange(range), value: range[0] };
}

function card(service: ServiceId, lang: ReplyLang, e: ReplyEntities, prefix: string): ReplyCard {
  const copy = CARD_COPY[service];
  return {
    id: `${prefix}-${service}${e.breed ? `-${e.breed.toLowerCase().replace(/\s+/g, "-")}` : ""}`,
    name: e.breed ? `${SERVICES[service].name} (${e.breed})` : SERVICES[service].name,
    price: servicePrice(service, e).value,
    category: "package",
    icon: copy.icon,
    badge: T(lang, ...copy.badge),
    highlights: T(lang, ...copy.highlights),
    ...(e.breed ? { breed: e.breed } : {}),
  };
}

function facialCard(lang: ReplyLang): ReplyCard {
  return {
    id: "addon-facial",
    name: T(lang, FACIAL.label, "Facial de arándanos"),
    price: FACIAL.price,
    category: "addon",
    icon: "🫐",
    badge: T(lang, "Free with welcome code", "Gratis con el cupón de bienvenida"),
    highlights: T(lang, "Tear-stain cleanse and fresh scent", "Limpieza de manchas lagrimales y aroma fresco"),
  };
}

function sizeNote(lang: ReplyLang, e: ReplyEntities): string {
  const tier = WEIGHT_TIERS.find((t) => t.id === tierOf(e));
  const mat = T(lang, `Matted coats add $${LIGHT_MAT}–$${SEVERE_MAT}.`, `Si hay nudos se suman $${LIGHT_MAT}–$${SEVERE_MAT}.`);
  if (!tier) return T(lang, `Final price depends on your dog's size and coat. ${mat}`, `El precio final depende del tamaño y el pelaje. ${mat}`);
  return T(lang, `Prices for a ${tier.label.toLowerCase()} dog (${tier.sub}) with a normal coat. ${mat}`, `Precios para un perro ${({ s: "pequeño", m: "mediano", l: "grande", g: "gigante" } as const)[tier.id]} (${tier.sub}) con pelaje normal. ${mat}`);
}

const AREA_ALIASES: Record<string, string> = {
  "Downtown Toronto": "King West",
  "Midtown Toronto": "Midtown",
  "The Annex": "The Annex",
  "Rosedale / Forest Hill": "Rosedale",
  "The Beaches / Leslieville": "The Beaches",
};
const DAY_ES: Record<string, string> = {
  Sunday: "domingos", Monday: "lunes", Tuesday: "martes", Wednesday: "miércoles", Thursday: "jueves", Friday: "viernes", Saturday: "sábados",
};

function scheduleLine(lang: ReplyLang, e: ReplyEntities): string {
  const area = e.location ? AREA_ALIASES[e.location] : undefined;
  const route = area ? ROUTE_DAYS.find((r) => r.area === area) : undefined;
  if (!route) return "";
  return T(lang, `\n📍 Our van is in ${route.area} on **${route.day}s**.`, `\n📍 La van pasa por ${route.area} los **${DAY_ES[route.day]}**.`);
}

const welcomeLine = (lang: ReplyLang) =>
  T(lang, `🎁 Code **\`${WELCOME_CODE}\`**: 15% off your first visit + a free Blueberry Facial.`, `🎁 Cupón **\`${WELCOME_CODE}\`**: 15% de descuento en tu primera visita + facial de arándanos gratis.`);

// ---------- client replies ----------

export function quoteReply(lang: ReplyLang, e: ReplyEntities): Reply {
  const where = e.location ? T(lang, ` in **${e.location}**`, ` en **${e.location}**`) : "";
  const who = e.breed ? `${e.breed}` : T(lang, "dog", "perro");
  const lines = SERVICE_IDS.map((id) => `• ${CARD_COPY[id].icon} **${SERVICES[id].name}:** ${servicePrice(id, e).label} CAD`).join("\n");
  return {
    text: T(lang, `🐾 **Quote for your ${who}${where}:**`, `🐾 **Cotización para tu ${who}${where}:**`) +
      `\n\n${lines}\n\n${sizeNote(lang, e)}${scheduleLine(lang, e)}\n\n${welcomeLine(lang)}\n\n` +
      T(lang, "👇 Add a package to your cart:", "👇 Agrega un paquete a tu carrito:"),
    actionItems: SERVICE_IDS.map((id) => card(id, lang, e, "quote")),
  };
}

export function priceTableReply(lang: ReplyLang): Reply {
  const lines = SERVICE_IDS.map((id) => {
    const tiers = WEIGHT_TIERS.map((t) => `${T(lang, t.label, ({ s: "Pequeño", m: "Mediano", l: "Grande", g: "Gigante" } as const)[t.id])} ${formatRange(priceRange(id, t.id))}`).join(" · ");
    return `• ${CARD_COPY[id].icon} **${SERVICES[id].name}:** ${tiers}`;
  }).join("\n");
  return {
    text: T(lang, "Our transparent CAD prices by dog size:", "Nuestros precios en CAD según el tamaño del perro:") +
      `\n\n${lines}\n\n${sizeNote(lang, {})}\n\n${welcomeLine(lang)}\n\n` +
      T(lang, "Tell me your dog's breed and I'll give you the exact price.", "Dime la raza de tu perro y te doy el precio exacto."),
    actionItems: SERVICE_IDS.map((id) => card(id, lang, {}, "table")),
  };
}

export function bathOnlyReply(lang: ReplyLang, e: ReplyEntities): Reply {
  const price = servicePrice("tidy", e).label;
  const who = e.breed ? T(lang, ` for your ${e.breed}`, ` para tu ${e.breed}`) : "";
  return {
    text: T(
      lang,
      `🐾 **Yes! Bath & Tidy is a bath-only service${who}: no body haircut.**\n\n• 🛁 Warm organic hydrobath\n• 💨 100% cage-free hand blow-dry\n• 🐾 Nail clipping & buffing\n• 👂 Ear cleansing & pad tidy\n\n💵 **Price:** ${price} CAD\n${sizeNote(lang, e)}\n\n${welcomeLine(lang)}`,
      `🐾 **¡Sí! Bath & Tidy es un servicio de solo baño${who}: sin corte de pelo.**\n\n• 🛁 Hidrobaño tibio orgánico\n• 💨 Secado a mano 100 % sin jaulas\n• 🐾 Corte y limado de uñas\n• 👂 Limpieza de oídos y almohadillas\n\n💵 **Precio:** ${price} CAD\n${sizeNote(lang, e)}\n\n${welcomeLine(lang)}`,
    ),
    actionItems: [card("tidy", lang, e, "bath"), facialCard(lang)],
  };
}

export function menuReply(lang: ReplyLang, e: ReplyEntities): Reply {
  const lines = SERVICE_IDS.map(
    (id, i) => `${i + 1}️⃣ ${CARD_COPY[id].icon} **${SERVICES[id].name} (${servicePrice(id, e).label} CAD):** ${T(lang, ...CARD_COPY[id].highlights)}.`,
  ).join("\n");
  return {
    text: T(lang, "Here is our mobile spa menu:", "Este es nuestro menú de spa móvil:") + `\n\n${lines}\n\n${sizeNote(lang, e)}\n\n${welcomeLine(lang)}\n\n` +
      T(lang, "👇 Tap a package to add it to your cart:", "👇 Toca un paquete para agregarlo a tu carrito:"),
    actionItems: SERVICE_IDS.map((id) => card(id, lang, e, "menu")),
  };
}

export function differenceReply(lang: ReplyLang, e: ReplyEntities): Reply {
  return {
    text: T(
      lang,
      `Here is the difference:\n\n• 🛁 **Bath & Tidy (${servicePrice("tidy", e).label} CAD):** hygiene and coat care: bath, hand dry, brush-out, nails and ears. **No haircut.**\n• ✂️ **Premium Full Groom (${servicePrice("full", e).label} CAD):** everything in Bath & Tidy **plus a full breed haircut** and hand-scissor styling.\n• ✨ **Ultimate Spa (${servicePrice("ultimate", e).label} CAD):** the full groom with scissoring, plus teeth brushing, gland expression, blueberry facial and pad moisturizing.`,
      `Esta es la diferencia:\n\n• 🛁 **Bath & Tidy (${servicePrice("tidy", e).label} CAD):** higiene y cuidado del pelaje: baño, secado a mano, cepillado, uñas y oídos. **Sin corte.**\n• ✂️ **Premium Full Groom (${servicePrice("full", e).label} CAD):** todo lo de Bath & Tidy **más un corte completo de raza** a tijera.\n• ✨ **Ultimate Spa (${servicePrice("ultimate", e).label} CAD):** el corte completo a tijera, más cepillado de dientes, vaciado de glándulas, facial de arándanos e hidratación de almohadillas.`,
    ),
    actionItems: [card("tidy", lang, e, "diff"), card("full", lang, e, "diff")],
  };
}

export function serviceRequestReply(lang: ReplyLang, e: ReplyEntities): Reply {
  const r = menuReply(lang, e);
  return { ...r, text: T(lang, "🐾 **Wonderful! We'd love to pamper your pooch at your doorstep.**\n\n", "🐾 **¡Excelente! Nos encantará consentir a tu perrito en la puerta de tu casa.**\n\n") + r.text };
}

export function bookingReply(lang: ReplyLang, e: ReplyEntities): Reply {
  const routes = ROUTE_DAYS.filter((r) => r.day !== "Sunday")
    .map((r) => (lang === "es" ? `${r.area} (${DAY_ES[r.day]})` : `${r.area} (${r.day}s)`))
    .join(", ");
  return {
    text: T(
      lang,
      `🐾 **Let's get your pooch booked!**\n\n1️⃣ **Pick a package** below and add it to your cart.\n2️⃣ **Your area:** ${routes}.\n3️⃣ **Check out** with Apple Pay, Google Pay, card or Interac; we confirm your exact time.\n\n${welcomeLine(lang)}`,
      `🐾 **¡Vamos a agendar a tu perrito!**\n\n1️⃣ **Elige un paquete** abajo y agrégalo al carrito.\n2️⃣ **Tu zona:** ${routes}.\n3️⃣ **Paga** con Apple Pay, Google Pay, tarjeta o Interac; te confirmamos la hora exacta.\n\n${welcomeLine(lang)}`,
    ),
    actionItems: [card("full", lang, e, "book"), card("ultimate", lang, e, "book")],
  };
}

export function bestServiceReply(lang: ReplyLang, e: ReplyEntities): Reply {
  return {
    text: T(
      lang,
      `Our recommendation:\n\n🌟 **The Ultimate Spa Experience (${servicePrice("ultimate", e).label} CAD)** for double coats and full pampering.\n✂️ **Premium Full Groom (${servicePrice("full", e).label} CAD)** for doodles, poodles and breeds that need a haircut.\n🛁 **Bath & Tidy (${servicePrice("tidy", e).label} CAD)** for short coats or between haircuts.`,
      `Nuestra recomendación:\n\n🌟 **The Ultimate Spa Experience (${servicePrice("ultimate", e).label} CAD)** para pelaje doble y consentir al máximo.\n✂️ **Premium Full Groom (${servicePrice("full", e).label} CAD)** para doodles, caniches y razas que necesitan corte.\n🛁 **Bath & Tidy (${servicePrice("tidy", e).label} CAD)** para pelo corto o entre cortes.`,
    ),
    actionItems: [card("ultimate", lang, e, "best"), card("full", lang, e, "best")],
  };
}

export function discountReply(lang: ReplyLang, e: ReplyEntities): Reply {
  return {
    text: T(
      lang,
      `🎁 **Welcome offer:** code **\`${WELCOME_CODE}\`** gives **15% off** your first appointment + a **free Blueberry Facial** ($${FACIAL.price} CAD value). Add a package below and the discount is applied at checkout.`,
      `🎁 **Oferta de bienvenida:** el cupón **\`${WELCOME_CODE}\`** te da un **15 % de descuento** en tu primera cita + un **facial de arándanos gratis** (valor $${FACIAL.price} CAD). Agrega un paquete y el descuento se aplica al pagar.`,
    ),
    actionItems: [card("full", lang, e, "promo")],
  };
}

export const WINTER_SALT_PRICE = SALT.price;

// ---------- owner copilot ----------

const money = (n: number) => `$${n.toLocaleString("en-CA")}`;

export function copilotReply(s: string, lang: ReplyLang, appointments: Appointment[]): Reply {
  const today = torontoToday();
  const todays = appointments.filter((a) => a.date === today && a.status !== "cancelled" && a.status !== "requested");
  const done = todays.filter((a) => a.status === "completed");
  const remaining = todays.filter((a) => a.status !== "completed");
  const route = routeForDate(today);

  if (/revenue|ingreso|kpi|balance|ganancia|factur/i.test(s)) {
    const k = monthKpis(appointments, today);
    const avg = k.grooms ? Math.round(k.revenue / k.grooms) : 0;
    const upcoming = upcomingBookings(appointments, today).length;
    const change = (p: number | null) => (p === null ? "" : ` (${p >= 0 ? "+" : ""}${p}% ${T(lang, "vs same days last month", "vs. mismos días del mes pasado")})`);
    return {
      text: T(
        lang,
        `📊 **Business summary (${k.monthLabel}):**\n\n• **Today:** ${done.length} of ${todays.length} stops done, ${money(done.reduce((a, b) => a + b.total, 0))} collected.\n• **Month to date:** ${money(k.revenue)}${change(k.revenueChange)} from ${k.grooms} grooms${change(k.groomsChange)}.\n• **Average ticket:** ${money(avg)}.\n• **Upcoming bookings from the portal and web:** ${upcoming}.`,
        `📊 **Resumen del negocio (${k.monthLabel}):**\n\n• **Hoy:** ${done.length} de ${todays.length} paradas hechas, ${money(done.reduce((a, b) => a + b.total, 0))} cobrados.\n• **En lo que va de mes:** ${money(k.revenue)}${change(k.revenueChange)} con ${k.grooms} servicios${change(k.groomsChange)}.\n• **Ticket medio:** ${money(avg)}.\n• **Próximas reservas del portal y la web:** ${upcoming}.`,
      ),
    };
  }

  if (/latchkey|lockbox|c[oó]digo|code|llave/i.test(s)) {
    const withCodes = remaining.filter((a) => a.latchkeyCode);
    const list = withCodes.map((a) => `• **${a.time} · ${a.petName}** (${a.address}): \`${a.latchkeyCode}\``).join("\n");
    return {
      text: withCodes.length
        ? T(lang, `🔑 **Latchkey codes for today's remaining stops:**\n\n${list}\n\nThe groomer app shows each code only when the groomer taps Reveal.`, `🔑 **Códigos Latchkey de las paradas que quedan hoy:**\n\n${list}\n\nLa app del groomer solo muestra cada código cuando se pulsa Reveal.`)
        : T(lang, "🔑 No Latchkey codes for today's remaining stops.", "🔑 No hay códigos Latchkey en las paradas que quedan hoy."),
    };
  }

  if (/route|ruta|stop|parada|density|densidad|zona|zone/i.test(s)) {
    const stops = todays.map((a) => `• ${a.time} · **${a.petName}** (${a.breed}, ${serviceName(a.service)}) · ${a.status === "completed" ? "✅" : a.status === "en_route" ? "🚐" : "⏳"}`).join("\n");
    const zones = zoneCoverage(appointments, today).slice(0, 3).map((z) => `${z.area} ${z.fill}%`).join(" · ");
    return {
      text: T(
        lang,
        `📍 **Today: ${route.day}, ${route.area} route (${todays.length} stops)**\n\n${stops || "No stops today."}\n\n**Fullest routes this month:** ${zones}.`,
        `📍 **Hoy: ${DAY_ES[route.day]}, ruta de ${route.area} (${todays.length} paradas)**\n\n${stops || "No hay paradas hoy."}\n\n**Rutas más llenas este mes:** ${zones}.`,
      ),
    };
  }

  if (/weather|clima|lluvia|rain|snow|nieve|tormenta|storm|reschedul|reprogram/i.test(s)) {
    let next = addDays(today, 7);
    while (weekdayIndex(next) !== weekdayIndex(today)) next = addDays(next, 1);
    return {
      text: T(
        lang,
        `❄️ **Weather simulation:** if today's route were cancelled, ${remaining.length} remaining ${remaining.length === 1 ? "stop" : "stops"} would move to the next ${route.area} day, **${formatDate(next)}**. I don't have a live weather feed, so this is a planning simulation only.`,
        `❄️ **Simulación por mal tiempo:** si se cancelara la ruta de hoy, ${remaining.length} ${remaining.length === 1 ? "parada pendiente pasaría" : "paradas pendientes pasarían"} al próximo día de ${route.area}, **${formatDate(next)}**. No tengo datos del tiempo en vivo: es solo una simulación para planificar.`,
      ),
    };
  }

  if (/vip|retention|retenci|club|member|socio|suscrip|subscri/i.test(s)) {
    return {
      text: T(
        lang,
        "👑 VIP memberships are not connected to the booking data yet, so I can't calculate retention. The dashboard shows sample figures (54 active members) until memberships are stored in the system.",
        "👑 Las membresías VIP aún no están conectadas a los datos de reservas, así que no puedo calcular la retención. El panel muestra cifras de ejemplo (54 socios activos) hasta que las membresías se guarden en el sistema.",
      ),
    };
  }

  if (/vaccin|vacun|compliance|rabies|rabia|bordetella|dhpp/i.test(s)) {
    return {
      text: T(
        lang,
        "🩺 **Vaccine audit:**\n\n• **Barnaby (#FP-0428):** Rabies valid until Nov 20, 2026 · DHPP valid until Jan 15, 2027 · **Bordetella expires Oct 24, 2026: booster due.**\n• Other dogs on today's route have no vaccine records uploaded yet: ask owners to upload certificates in the Customer Portal.",
        "🩺 **Auditoría de vacunas:**\n\n• **Barnaby (#FP-0428):** Rabia vigente hasta el 20 nov 2026 · DHPP vigente hasta el 15 ene 2027 · **Bordetella vence el 24 oct 2026: toca refuerzo.**\n• Los demás perros de la ruta de hoy aún no tienen vacunas registradas: pide a los dueños que suban los certificados en el portal.",
      ),
    };
  }

  if (/water|agua|tank|tanque|fuel|combustible|gas|van/i.test(s)) {
    return {
      text: T(
        lang,
        "🚐 **Van #1 (sample telemetry):** fuel 72%, water tank full, next service Dec 12. The van has no live sensors connected yet; these are the figures entered on the dashboard.",
        "🚐 **Van #1 (telemetría de ejemplo):** combustible 72 %, tanque de agua lleno, próximo mantenimiento 12 dic. La van aún no tiene sensores conectados; son las cifras que figuran en el panel.",
      ),
    };
  }

  return {
    text: T(
      lang,
      "👨‍💼 **Operations Copilot:** ask me about today's route, revenue and bookings, Latchkey codes, vaccine records, weather rescheduling or VIP members.",
      "👨‍💼 **Copiloto de operaciones:** pregúntame por la ruta de hoy, ingresos y reservas, códigos Latchkey, vacunas, reprogramación por clima o socios VIP.",
    ),
  };
}
