import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Send, ShoppingCart, Check, CreditCard, Trash2, ArrowRight, Cpu, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import qimmiqAvatar from "@/assets/qimmiq-avatar.jpg";
import { recordRealCompletedGroom } from "@/lib/useLiveGroomCounter";

type Mode = "client" | "admin";
type Lang = "en" | "es" | "de" | "fr" | "it" | "pt";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: "package" | "addon";
  icon?: string;
  badge?: string;
  highlights?: string;
  breed?: string;
}

type Msg = {
  from: "user" | "ai";
  text: string;
  actionItems?: CartItem[];
};

const CLIENT_PROMPTS = [
  "What's the price for a Golden Retriever in Downtown?",
  "Are you open on Sundays?",
  "What's the price for a 30lb Goldendoodle?",
  "How do VIP Club subscriptions work?",
  "Which Toronto areas do you service?",
  "How does Latchkey contactless work?",
  "What vaccines are required in Ontario?",
  "Do you accept Interac & Apple Pay?",
];

const ADMIN_PROMPTS = [
  "📊 Today's revenue & monthly KPIs",
  "🚐 Van #1 water & eco-fuel levels",
  "🔑 Active Latchkey codes today",
  "📍 Toronto route stops & density",
  "👑 VIP Club retention rate",
  "❄️ Weather rescheduling simulation",
  "🩺 Pet vaccine compliance audit",
];

interface ExtractedEntities {
  breed?: string;
  breedTier?: "small" | "medium" | "large" | "giant";
  location?: string;
  isBathOnly?: boolean;
  isFullGroom?: boolean;
}

function extractEntities(text: string): ExtractedEntities {
  const s = text.toLowerCase();
  const entities: ExtractedEntities = {};

  // Breeds & Size Tiers
  // Doodle mixes first: "goldendoodle" and "labradoodle" also contain "golden" and "lab".
  if (s.includes("bernedoodle")) {
    entities.breed = "Giant Bernedoodle";
    entities.breedTier = "giant";
  } else if (s.includes("doodle") || s.includes("cockapoo")) {
    entities.breed = s.includes("labradoodle") ? "Labradoodle" : s.includes("cockapoo") ? "Cockapoo" : "Goldendoodle";
    entities.breedTier = "medium";
  } else if (
    s.includes("golden") || s.includes("labrador") || s.includes("lab") ||
    s.includes("pastor aleman") || s.includes("pastor alemán") || s.includes("german shepherd") ||
    s.includes("husky") || s.includes("boxer") || s.includes("rottweiler")
  ) {
    entities.breed = s.includes("golden")
      ? "Golden Retriever"
      : s.includes("labrador") || s.includes("lab")
      ? "Labrador Retriever"
      : s.includes("husky")
      ? "Siberian Husky"
      : "Large Breed Dog";
    entities.breedTier = "large";
  } else if (
    s.includes("bernedoodle") || s.includes("great dane") || s.includes("san bernardo") ||
    s.includes("saint bernard") || s.includes("mastiff") || s.includes("newfoundland") ||
    s.includes("terranova") || s.includes("gran danes") || s.includes("gran danés")
  ) {
    entities.breed = s.includes("bernedoodle")
      ? "Giant Bernedoodle"
      : s.includes("great dane") || s.includes("danes")
      ? "Great Dane"
      : "Giant Breed Dog";
    entities.breedTier = "giant";
  } else if (
    s.includes("doodle") || s.includes("goldendoodle") || s.includes("cockapoo") ||
    s.includes("frenchie") || s.includes("french bulldog") || s.includes("bulldog") ||
    s.includes("aussie") || s.includes("beagle") || s.includes("spaniel") ||
    s.includes("corgi") || s.includes("border collie")
  ) {
    entities.breed = s.includes("frenchie") || s.includes("french bulldog")
      ? "French Bulldog"
      : s.includes("doodle") || s.includes("goldendoodle")
      ? "Goldendoodle"
      : s.includes("corgi")
      ? "Corgi"
      : "Medium Breed Dog";
    entities.breedTier = "medium";
  } else if (
    s.includes("pomeranian") || s.includes("pomerania") || s.includes("pom") ||
    s.includes("shih tzu") || s.includes("shihtzu") || s.includes("maltese") ||
    s.includes("maltes") || s.includes("maltés") || s.includes("yorkie") ||
    s.includes("yorkshire") || s.includes("chihuahua") || s.includes("dachshund") ||
    s.includes("teckel") || s.includes("pug") || s.includes("bichon")
  ) {
    entities.breed = s.includes("pomeran") || s.includes("pom")
      ? "Pomeranian"
      : s.includes("shih tzu") || s.includes("shihtzu")
      ? "Shih Tzu"
      : s.includes("maltes")
      ? "Maltese"
      : s.includes("york")
      ? "Yorkshire Terrier"
      : "Small Pup";
    entities.breedTier = "small";
  } else if (s.includes("poodle") || s.includes("caniche")) {
    entities.breed = "Poodle";
    entities.breedTier = "medium";
  }

  // Locations / Toronto Neighborhoods
  if (
    s.includes("downtown") || s.includes("centro") || s.includes("king west") ||
    s.includes("liberty village") || s.includes("cityplace") || s.includes("queen west") ||
    s.includes("waterfront") || s.includes("bay street")
  ) {
    entities.location = "Downtown Toronto";
  } else if (
    s.includes("midtown") || s.includes("yonge") || s.includes("eglinton") ||
    s.includes("mount pleasant") || s.includes("davisville")
  ) {
    entities.location = "Midtown Toronto";
  } else if (s.includes("yorkville") || s.includes("bloor")) {
    entities.location = "Yorkville";
  } else if (s.includes("annex") || s.includes("koreatown") || s.includes("christie")) {
    entities.location = "The Annex";
  } else if (s.includes("rosedale") || s.includes("summerhill") || s.includes("forest hill")) {
    entities.location = "Rosedale / Forest Hill";
  } else if (
    s.includes("beach") || s.includes("playas") || s.includes("leslieville") ||
    s.includes("riverdale") || s.includes("east york")
  ) {
    entities.location = "The Beaches / Leslieville";
  } else if (s.includes("north york")) {
    entities.location = "North York";
  } else if (s.includes("etobicoke")) {
    entities.location = "Etobicoke";
  } else if (s.includes("scarborough")) {
    entities.location = "Scarborough";
  } else if (s.includes("leaside")) {
    entities.location = "Leaside";
  } else if (s.includes("mississauga") || s.includes("markham")) {
    entities.location = "Greater Toronto Area (GTA)";
  }

  // Services
  if (
    s.includes("bañ") || s.includes("ban") || s.includes("wash") || s.includes("bath") ||
    s.includes("lavar") || s.includes("hidro") || s.includes("limpiar")
  ) {
    entities.isBathOnly = true;
  }
  if (
    s.includes("corte") || s.includes("tijera") || s.includes("cut") || s.includes("groom") ||
    s.includes("full groom") || s.includes("peluquer") || s.includes("estil")
  ) {
    entities.isFullGroom = true;
  }

  return entities;
}

function checkExplicitLanguageSwitch(text: string): Lang | null {
  const s = text.toLowerCase().trim();

  if (
    /(me lo (podrías|podrias|puedes) decir en ing[l|é]s|en ing[l|é]s|habla en ing[l|é]s|puedes hablar en ing[l|é]s|traduce al ing[l|é]s|speak in english|in english|can you speak english|english please|switch to english|parle en anglais|auf englisch)/i.test(s)
  ) {
    return "en";
  }

  if (
    /(en espa[ñn]ol|habla en espa[ñn]ol|puedes hablar en espa[ñn]ol|me lo dices en espa[ñn]ol|in spanish|speak in spanish|switch to spanish|parle en espagnol|auf spanisch)/i.test(s)
  ) {
    return "es";
  }

  if (/(auf deutsch|in german|en alem[a|á]n|sprechen sie deutsch)/i.test(s)) {
    return "de";
  }

  if (/(en fran[cç]ais|in french|en franc[e|é]s|parlez-vous fran[cç]ais)/i.test(s)) {
    return "fr";
  }

  return null;
}

function detectLanguage(text: string, currentLang: Lang = "en"): Lang {
  const explicit = checkExplicitLanguageSwitch(text);
  if (explicit) return explicit;

  const s = text.toLowerCase();
  // Unicode-aware tokens, so accented words like "qué" or "cuánto" are counted
  // (the ASCII \b boundary used before never matched them).
  const words = s.match(/\p{L}+/gu) ?? [];

  const scores: Record<Lang, number> = { en: 0, es: 0, de: 0, fr: 0, it: 0, pt: 0 };
  for (const w of words) {
    for (const l of Object.keys(LANG_WORDS) as Lang[]) {
      if (LANG_WORDS[l].has(w)) scores[l] += 1;
    }
  }
  if (/[¿¡ñ]/.test(s)) scores.es += 3;

  let best: Lang = currentLang;
  let bestScore = 0;
  for (const l of Object.keys(scores) as Lang[]) {
    if (scores[l] > bestScore) {
      best = l;
      bestScore = scores[l];
    }
  }
  return best;
}

const LANG_WORDS: Record<Lang, Set<string>> = {
  en: new Set(
    "hi hello hey good morning afternoon evening night how what when where who why which book appointment quote price pricing cost dog dogs pooch pup puppy service services best schedule open hours sunday sundays groom grooming thanks thank please yes sure want know tell do does you your my is are the and can for in of".split(" "),
  ),
  es: new Set(
    "hola buenos buenas que qué como cómo cual cuál quiero quisiera gustaría gustaria agendar reservar reserva cita citas servicio servicios perro perros perrito perrita mascota mascotas precio precios cuanto cuánto cuesta cuestan tarifa donde dónde gracias favor casa puerta baño bano bañar banar corte raza sí claro abren abierto domingo domingos días dias zona zonas barrio barrios los las el la del mi tu es son para por pasa pasan vacunas vacuna necesita tienen hacen cubren furgoneta libras kilos y en de con".split(" "),
  ),
  de: new Set("hallo guten wie was preis preise kosten hund hunde sonntag termin buchen danke bitte wann welche ist und der die das ich".split(" ")),
  fr: new Set("bonjour salut bonsoir combien prix tarif dimanche ouvert chien chiens toilettage réserver merci quartier les est vous je et".split(" ")),
  it: new Set("ciao buongiorno quanto prezzo domenica aperti cane cani toelettatura prenotare grazie bagno sono".split(" ")),
  pt: new Set("olá obrigado obrigada preço preco custa cachorro cão tosa banho bairro aberto você".split(" ")),
};

function getUserProfile(): { name?: string; petName?: string; breed?: string } {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("fp_user_profile");
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {};
}

interface AgentReplyResult {
  text: string;
  actionItems?: CartItem[];
}

/**
 * Live Google Gemini 2.0 Flash integration
 * Calls Google AI REST endpoint with full Toronto Dog Spa context and JSON action items parsing.
 */
async function callGeminiLive(
  query: string,
  history: Msg[],
  entities: ExtractedEntities,
  lang: Lang,
  apiKey: string
): Promise<AgentReplyResult | null> {
  try {
    const breedInfo = entities.breed ? `Known pet breed: ${entities.breed} (${entities.breedTier || "medium"} tier)` : "Breed: Not specified yet";
    const locInfo = entities.location ? `Known Toronto neighborhood: ${entities.location}` : "Location: Toronto general";

    const systemPrompt = `You are Qimmiq, the intelligent, warm, consultative, and sales-focused AI concierge for "The Fresh Pooch Toronto" (a luxury, 100% cage-free mobile dog spa in Toronto, Canada).

CORE BRAND FACTS:
- Cage-Free Philosophy: We NEVER use cages or cage dryers. Every appointment is a 1-on-1 private spa session inside our custom, heated luxury Mercedes Sprinter trailer parked right in the client's driveway or curbside.
- Services & Transparent CAD Pricing:
  1. "Bath & Tidy" (Hydro-Bath & Essential Hygiene): Warm organic botanical hydrobath, 100% cage-free gentle hand fluff dry, deep brush-out & de-shedding, nail clipping & dremel buffing, antiseptic ear cleaning, and pad tidy. IMPORTANT: This package DOES NOT include a body haircut or scissor styling. Rates: Small pups (<20 lbs) $105 CAD; Medium (20-45 lbs) $125 CAD; Large (45-75 lbs, e.g. Golden Retriever, Labrador) $155 CAD; Giant (76+ lbs) $185 CAD.
  2. "Premium Full Groom": Includes everything in Bath & Tidy PLUS full custom breed haircut & hand-scissor styling. Rates: Small $120–$140 CAD; Medium $145–$185 CAD; Large $185–$225 CAD; Giant $215–$260 CAD.
  3. "The Ultimate Pooch Spa & Cut": The royal treatment with deep de-shedding blowout, artisan scissor styling, winter salt paw balm, and an Organic Blueberry Facial ($195–$235 CAD).
  4. Popular Add-ons: Organic Blueberry Facial ($15 CAD), Winter Salt Paw Balm ($12 CAD), Teeth Brushing ($15 CAD).
- Welcome Privilege / Coupon: Code "TORONTOFRESH15" gives 15% OFF their first visit + a FREE Organic Blueberry Facial ($15 CAD value).
- Latchkey Contactless Service: Secure lockbox/smart lock system (AES-256 encrypted). We groom 1-on-1 while pet parents work, return the pet safely inside, refill fresh water, and send photo report cards.
- Operating Hours: Open 7 days a week, Monday through Sunday, 8:30 AM to 6:00 PM.
- Toronto Neighborhoods: Midtown (Wed/Fri), Downtown (Mon/Wed), The Annex (Tue/Thu), Rosedale & Forest Hill (Thu), The Beaches (Sat), Yorkville, Leaside, North York, Etobicoke, Scarborough, and GTA.
- Payment Methods: Apple Pay, Google Pay, Interac e-Transfer, Visa, Mastercard, American Express.

CONVERSATION & SALES CLOSING RULES:
1. Speak in the EXACT language used by the user (if Spanish -> natural, warm Spanish; if English -> Canadian English; if German -> German; if French -> French; etc.).
2. Always answer directly, empathetically, and conversationally like an expert human concierge. Never repeat generic greetings or fallbacks.
3. If the user asks whether there is a bath-only service, confirm enthusiastically that YES, Bath & Tidy is an independent service with NO haircut, explain what it includes, provide pricing, and offer to add it to their cart.
4. If the user expresses a desire to book or hire a service, present the options clearly with prices and guide them to checkout with their 15% discount.
5. Context: ${breedInfo}. ${locInfo}.

ACTIONABLE CART ITEMS:
Whenever you recommend or discuss specific services that the user might want to buy or book, append at the VERY END of your message a JSON block formatted exactly like this:
\`\`\`json
{
  "actionItems": [
    {
      "id": "bath-tidy-rec",
      "name": "Bath & Tidy",
      "price": 125,
      "category": "package",
      "icon": "🛁",
      "badge": "No Haircut",
      "highlights": "Warm hydrobath, hand fluff dry, ear & nail care"
    }
  ]
}
\`\`\`
Do not include commentary inside the json block. Keep your conversational response above it.`;

    const contents: any[] = [];
    
    // Add user turns from history (last 5 turns)
    const recent = history.slice(-5);
    recent.forEach((m) => {
      contents.push({
        role: m.from === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      });
    });

    // Add current query
    contents.push({
      role: "user",
      parts: [{ text: query }],
    });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) return null;

    let rawText = candidate;
    let actionItems: CartItem[] | undefined = undefined;

    const jsonMatch = rawText.match(/```json\s*(\{[\s\S]*?\})\s*```/i);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed.actionItems)) {
          actionItems = parsed.actionItems;
        } else if (Array.isArray(parsed.recommended)) {
          actionItems = parsed.recommended;
        }
        rawText = rawText.replace(jsonMatch[0], "").trim();
      } catch {
        // ignore parse error
      }
    }

    return { text: rawText, actionItems };
  } catch (err) {
    console.warn("Gemini Live API error, falling back to local engine:", err);
    return null;
  }
}

function generateAgentReply(
  query: string,
  mode: Mode,
  activeLang: Lang = "en",
  turnCount: number = 0,
  lastEntities?: ExtractedEntities
): AgentReplyResult {
  const explicitSwitch = checkExplicitLanguageSwitch(query);
  const detectedLang = explicitSwitch || detectLanguage(query, activeLang);
  // The local engine writes its replies in English and Spanish only.
  const lang: Lang = detectedLang === "es" ? "es" : "en";
  const s = query.toLowerCase();
  const currentEntities = extractEntities(query);
  const entities: ExtractedEntities = {
    breed: currentEntities.breed || lastEntities?.breed,
    breedTier: currentEntities.breedTier || lastEntities?.breedTier,
    location: currentEntities.location || lastEntities?.location,
    isBathOnly: currentEntities.isBathOnly !== undefined ? currentEntities.isBathOnly : lastEntities?.isBathOnly,
    isFullGroom: currentEntities.isFullGroom !== undefined ? currentEntities.isFullGroom : lastEntities?.isFullGroom,
  };

  const profile = getUserProfile();
  const userName = profile.name;
  const petName = profile.petName;

  // 1. EXPLICIT LANGUAGE SWITCH / TRANSLATION REQUEST
  if (explicitSwitch) {
    if (explicitSwitch === "en") {
      if (entities.breed || entities.location) {
        return {
          text: `Certainly! Here is the quote in Canadian English: 🐾\n\nFor a **${entities.breed || "dog"}** in **${entities.location || "Toronto"}**:\n\n• 🛁 **Hydro-Bath & De-Shedding (Bath & Tidy):** **$155–$175 CAD**\n  *Includes:* Warm botanical hydrobath, deep undercoat de-shedding to remove loose dead fur, gentle hand blow-dry (100% cage-free), nail clipping & buffing, ear cleansing, and sanitary tidy.\n\n• ✂️ **The Ultimate Pooch Spa & Cut:** **$195–$225 CAD**\n  *Adds:* Custom artisan scissor styling, winter salt paw protection balm, and an Organic Blueberry Facial.\n\n📍 **Schedule:** Our luxury mobile van visits ${entities.location || "your neighborhood"} on set weekly route days.\n\n🎁 **Welcome Privilege:** Use code **\`TORONTOFRESH15\`** for **15% OFF** + a Free Organic Blueberry Facial ($15 CAD value).\n\nTap below to add your preferred package directly to your cart and book your doorstep visit:`,
          actionItems: [
            {
              id: "bath-shed-en",
              name: "Hydro-Bath & De-Shedding",
              price: 155,
              category: "package",
              icon: "🛁",
              badge: "100% Cage-Free",
              highlights: "Warm botanical bath, undercoat blowout, ears & nails",
              breed: entities.breed || "Golden Retriever",
            },
            {
              id: "ultimate-spa-en",
              name: "The Ultimate Pooch Spa & Cut",
              price: 195,
              category: "package",
              icon: "✨",
              badge: "Royal Luxury",
              highlights: "Scissor styling, Blueberry Facial & Winter Paw Balm",
              breed: entities.breed || "Golden Retriever",
            },
            {
              id: "facial-addon-en",
              name: "Organic Blueberry Facial",
              price: 15,
              category: "addon",
              icon: "🫐",
              badge: "FREE with Code",
              highlights: "Tear-stain cleanser & sweet artisan scent",
            },
          ],
        };
      }
      return {
        text: `Certainly! I'd be delighted to speak in Canadian English with you. 🐾\n\nHow are you and your pooch doing today? I can help you with an exact quote for your dog's breed, check what days our mobile spa is in your Toronto neighborhood, or guide you to book a 1-on-1 cage-free session. What can I do for you?`,
      };
    }

    if (explicitSwitch === "es") {
      return {
        text: `¡Por supuesto! Hablamos en español con mucho gusto. 🐾\n\n¿Cómo están tú y tu perrito hoy? Puedo darte una cotización exacta para su raza, decirte qué días estamos en tu vecindario de Toronto o ayudarte a agendar una cita 100% libre de jaulas frente a tu puerta. ¿En qué te puedo colaborar?`,
      };
    }
  }

  // 2. ADMIN COPILOT REPLIES
  if (mode === "admin") {
    if (s.includes("revenue") || s.includes("ingreso") || s.includes("kpi") || s.includes("balance") || s.includes("ganancia") || s.includes("umsatz")) {
      return {
        text: lang === "en"
          ? "📊 **Daily Operations & Revenue Executive Summary:**\n\n• **Today's Completed Appointments:** 5 spa services in Midtown & The Annex.\n• **Gross Revenue Collected Today:** $860.00 CAD.\n• **Month-to-Date Revenue:** $21,280.00 CAD (+15.8% vs target).\n• **Average Ticket:** $154.20 CAD per dog.\n• **Tips Collected:** $142.00 CAD (16.5% avg, 100% disbursed to groomers).\n• **Van #1 Route Utilization:** 94% booked capacity.\n\n*Key Driver:* 54 active VIP Pooch Club members generate $7,830.00 CAD in predictable monthly recurring revenue."
          : "📊 **Resumen Financiero y Operaciones de Hoy:**\n\n• **Citas de hoy:** 5 servicios de spa completados en Midtown y The Annex.\n• **Ingresos recaudados hoy:** $860.00 CAD.\n• **Facturación del mes:** $21,280.00 CAD (+15.8% sobre objetivo).\n• **Ticket promedio:** $154.20 CAD por perro.\n• **Propinas hoy:** $142.00 CAD (16.5% promedio, 100% transferidas a groomers).\n• **Ocupación de van #1:** 94% de slots reservados.\n\n*Hito operacional:* 54 perritos con suscripción VIP activa generan $7,830.00 CAD de MRR garantizado.",
      };
    }

    if (s.includes("water") || s.includes("agua") || s.includes("van") || s.includes("tank") || s.includes("fuel") || s.includes("combustible") || s.includes("wasser")) {
      return {
        text: lang === "en"
          ? "🚐 **Live Telemetry — Mobile Van #1 (Luxury Spa Trailer):**\n\n• **Fresh Heated Water Tank:** 72% (≈ 95 Litres available — sufficient for 4 more full grooms without refilling).\n• **Greywater Tank:** 31% capacity.\n• **Generator / Eco-Fuel Level:** 78% (next refill scheduled Friday morning).\n• **Solar & Lithium Battery Bank:** 88% charge.\n• **Next Preventive Maintenance:** Dec 12 (water pump & silent generator inspection).\n• **Current GPS Route Location:** Roehampton Ave Corridor, Midtown Toronto (M4P)."
          : "🚐 **Telemetría en Vivo — Van #1 (Luxury Mobile Spa):**\n\n• **Tanque de Agua Dulce:** 72% (~95 Litros disponibles, suficiente para 4 servicios adicionales sin recargar).\n• **Tanque de Aguas Grises:** 31% de capacidad (vaciado seguro programado al fin de turno).\n• **Combustible / Generador silencioso:** 78% (próximo repostaje el viernes).\n• **Baterías Eco-Litio & Solar:** 88% de carga.\n• **Próximo Mantenimiento Preventivo:** 12 de Diciembre (inspección de bomba y fluidos).\n• **Ubicación GPS actual:** Corredor Roehampton Ave, Midtown (M4P 1R4).",
      };
    }

    if (s.includes("latchkey") || s.includes("code") || s.includes("codigo") || s.includes("código") || s.includes("llave") || s.includes("schlüssel")) {
      return {
        text: lang === "en"
          ? "🔑 **Active Latchkey Codes for Today's Toronto Stops:**\n\n• **Midtown (10:00 AM):** Barnaby (Goldendoodle) — Code: `4821` (Side wooden gate; indoor cat Jasper in sunroom).\n• **The Annex (12:30 PM):** Winston (Poodle) — Code: `9042` (Smart Lock Schlage).\n• **Rosedale (3:00 PM):** Coco (Pomeranian) — Code: `1537` (Porch lockbox combination).\n\n*Security Protocol:* All codes are secured via AES-256 encryption and only revealed in the Groomer App when within 50 meters of the home via GPS."
          : "🔑 **Códigos Latchkey Activos de Hoy (Toronto):**\n\n• **Midtown (10:00 AM):** Barnaby (Goldendoodle) — Código: `4821` (Portón lateral de madera; gato Jasper en terraza).\n• **The Annex (12:30 PM):** Winston (Poodle) — Código: `9042` (Smart Lock Schlage).\n• **Rosedale (3:00 PM):** Coco (Pomeranian) — Código: `1537` (Lockbox con combinación en porche).\n\n*Protocolo de Seguridad:* Todos los códigos se encriptan bajo AES-256 geolocalizado. Solo se revelan en la app del peluquero certificado cuando el GPS detecta la van a menos de 50 metros del domicilio.",
      };
    }

    return {
      text: lang === "en"
        ? "👨‍💼 **Operations Copilot Active:**\nI can provide live updates on today's revenue ($860 CAD), Van #1 freshwater (72%) & fuel, active Latchkey security codes, neighborhood route densities, or vaccine compliance audits. What would you like to review?"
        : "👨‍💼 **Copiloto de Operaciones Qimmiq Online:**\nPuedo informarte en vivo sobre ingresos ($860 hoy / $21,280 mes), telemetría de la Van #1 (agua 72%), códigos Latchkey activos, saturación de rutas por barrios o auditoría de vacunas. ¿Qué deseas consultar?",
    };
  }

  // 3. SPECIALIZED INQUIRY: BATH ONLY / "SOLO BAÑO" / "HAY SOLO DE ESE?"
  const isBathOnlyInquiry =
    /solo\s*ba[ñn]o|solamente\s*ba[ñn]o|servicio\s*de\s*ba[ñn]o|solo\s*ba[ñn]ar|solo\s*de\s*ese|existe\s*solo|hay\s*solo|solo\s*pregunto\s*si\s*(solo\s*)?existe|solo\s*ba[ñn]an|ba[ñn]o\s*solamente|solo\s*quiero\s*ba[ñn]ar|bath\s*only|only\s*a?\s*bath|just\s*a?\s*bath|only\s*bath|only\s*wash|just\s*wash|wash\s*only|bain\s*seulement|nur\s*baden/i.test(s) ||
    ((s.includes("bañ") || s.includes("bath") || s.includes("bain") || s.includes("baden")) && (s.includes("solo") || s.includes("only") || s.includes("just") || s.includes("existe") || s.includes("hay") || s.includes("pregunt")));

  if (isBathOnlyInquiry) {
    if (entities.breed) {
      const b = entities.breed;
      const price = entities.breedTier === "small" ? 105 : entities.breedTier === "large" ? 155 : entities.breedTier === "giant" ? 185 : 125;
      const discounted = (price * 0.85).toFixed(2);

      return {
        text: lang === "en"
          ? `🐾 **Yes, absolutely! We have an independent Bath-Only package for your ${b}!**\n\nOur service is called **Hydro-Bath & De-Shedding (Bath & Tidy)**. It is specifically designed for dogs who need deep hygiene, undercoat removal, and gentle care **without any body hair clipper or scissor haircut**:\n\n• 🛁 **Warm Organic Botanical Hydrobath:** Therapeutic warm water with gentle hypoallergenic shampoo.\n• 💨 **100% Cage-Free Hand Blow-Dry:** High-velocity fluff dry that expels loose dead hair (zero cage dryers, zero stress).\n• 🐾 **Nail Trimming & Dremel Buffing:** Smooth, rounded edges that won't scratch floors.\n• 👂 **Antiseptic Ear Cleansing & Pad Tidy:** Complete ear care and pad clearing.\n• ❌ **No Body Haircut or Scissor Trimming.**\n\n💵 **Price for your ${b}:** **$${price} CAD** (or only **$${discounted} CAD** with code \`TORONTOFRESH15\`).\n🎁 **Bonus:** Includes a **FREE Organic Blueberry Facial** ($15 CAD value)!\n\n👇 **Tap below to add the Bath & Tidy package directly to your cart:**`
          : `🐾 **¡Sí, por supuesto! Contamos exactamente con un servicio de solo baño para tu ${b}!**\n\nNuestro paquete se llama **Hidro-Baño & Deslanado Profundo (Bath & Tidy)**. Está especialmente pensado para perritos que necesitan higiene profunda y cuidado del pelaje **sin cortar el largo de su pelo corporal**:\n\n• 🛁 **Hidrobaño tibio con champú botánico orgánico:** Limpieza terapéutica hipoalergénica.\n• 💨 **Secado suave 100% a mano sin jaulas:** Turbina de velocidad gradual para expulsar el pelo muerto suelto (jamás usamos jaulas de secado).\n• 🐾 **Corte y limado de uñas con torno suave:** Quedan redondeadas para no rayar pisos.\n• 👂 **Limpieza antiséptica de oídos y despeje de almohadillas:** Higiene completa.\n• ❌ **Sin corte de pelo corporal con máquina ni tijera.**\n\n💵 **Tarifa para tu ${b}:** **$${price} CAD** (con el cupón **\`TORONTOFRESH15\`** te queda en solo **$${discounted} CAD**).\n🎁 **Beneficio de bienvenida:** Incluye un **Facial de Arándanos Orgánico GRATIS** ($15 CAD de regalo).\n\n👇 **Agrega el servicio de solo baño directamente a tu carrito con 1 clic:**`,
        actionItems: [
          {
            id: `bath-tidy-${b.toLowerCase().replace(/\s+/g, "-")}`,
            name: `Bath & Tidy (Solo Baño - ${b})`,
            price: price,
            category: "package",
            icon: "🛁",
            badge: "Sin Corte de Pelo",
            highlights: "Hidrobaño tibio, secado 100% a mano sin jaulas, uñas y oídos",
            breed: b,
          },
          {
            id: "blueberry-facial-free",
            name: "Organic Blueberry Facial",
            price: 15,
            category: "addon",
            icon: "🫐",
            badge: "GRATIS con Cupón",
            highlights: "Limpieza facial de manchas lagrimales y aroma delicioso",
          },
        ],
      };
    }

    // General bath-only question (no breed specified yet)
    return {
      text: lang === "en"
        ? `🐾 **Yes, absolutely! We offer an independent, bath-only package called "Bath & Tidy"!**\n\nYou are never forced to book a full haircut. Our **Bath & Tidy (Hydro-Bath & Essential Hygiene)** is designed specifically for dogs that only need deep cleansing, de-shedding, and freshness **without cutting their coat length**:\n\n✨ **What Bath & Tidy includes:**\n• 🛁 **Warm botanical hydrobath:** Therapeutic organic wash customized to their skin.\n• 💨 **100% Cage-free hand blow-dry:** Gentle high-velocity hand drying (zero cages ever).\n• 🐾 **Nail clipping & smooth dremel buffing:** Rounded tips that protect hardwood.\n• 👂 **Antiseptic ear cleansing & pad clearing:** Complete hygiene maintenance.\n• ❌ **Does NOT include:** Body scissor styling or machine clipper haircut.\n\n💵 **Transparent Bath & Tidy Rates by Weight:**\n• **Small Dogs (<20 lbs, e.g. Shih Tzu, Pom):** $105 CAD\n• **Medium Dogs (20–45 lbs, e.g. Frenchie, Beagle):** $125 CAD\n• **Large Dogs (45–75 lbs, e.g. Golden, Lab):** $155 CAD\n• **Giant Dogs (76+ lbs, e.g. Bernedoodle):** $185 CAD\n\n🎁 **Welcome Privilege:** Use code **\`TORONTOFRESH15\`** for **15% OFF** + Free Organic Blueberry Facial ($15 CAD value)!\n\n👇 **Select the Bath & Tidy package below to add directly to your cart:**`
        : `🐾 **¡Sí, por supuesto! Contamos exactamente con nuestro servicio independiente de solo baño: "Bath & Tidy"!**\n\nNo estás obligado a contratar un corte completo si tu perro no lo necesita. Nuestro paquete **Bath & Tidy (Hidro-Baño & Aseo Esencial)** está diseñado exclusivamente para perritos que solo requieren baño profundo, deslanado e higiene **sin tocar el largo de su pelaje corporal**:\n\n✨ **¿Qué incluye el servicio Bath & Tidy?**\n• 🛁 **Hidrobaño tibio orgánico:** Con champú botánico hipoalergénico que nutre la piel.\n• 💨 **Secado 100% a mano sin jaulas:** Secado suave con turbina de velocidad gradual (jamás usamos jaulas).\n• 🐾 **Corte y limado de uñas con torno suave:** Redondeadas para no arañar suelos.\n• 👂 **Limpieza antiséptica de oídos y despeje higiénico de almohadillas.**\n• ❌ **No incluye:** Corte o perfilado de pelo corporal con máquina ni tijera.\n\n💵 **Tarifas transparentes según el peso de tu perrito:**\n• **Perros Pequeños (<20 lbs, ej. Shih Tzu, Pomeranian):** $105 CAD\n• **Perros Medianos (20–45 lbs, ej. Frenchie, Beagle):** $125 CAD\n• **Perros Grandes (45–75 lbs, ej. Golden Retriever, Labrador):** $155 CAD\n• **Perros Gigantes (76+ lbs, ej. Bernedoodle, Mastín):** $185 CAD\n\n🎁 **Beneficio de bienvenida:** Aplica el cupón **\`TORONTOFRESH15\`** para un **15% de descuento** en tu primera visita + un **Facial de Arándanos GRATIS** ($15 CAD).\n\n👇 **Agrega el servicio de solo baño directamente a tu carrito con 1 clic:**`,
      actionItems: [
        {
          id: "pkg-bath-tidy-general",
          name: "Bath & Tidy (Solo Baño & Higiene)",
          price: 125,
          category: "package",
          icon: "🛁",
          badge: "Sin Corte de Pelo",
          highlights: "Hidrobaño tibio, secado a mano 100% sin jaulas, limado de uñas y oídos",
        },
        {
          id: "pkg-blueberry-facial",
          name: "Organic Blueberry Facial",
          price: 15,
          category: "addon",
          icon: "🫐",
          badge: "GRATIS con Cupón",
          highlights: "Tratamiento facial de arándanos orgánico para manchas lagrimales",
        },
      ],
    };
  }

  // 4. DIRECT SERVICE REQUEST: "I WANT A SERVICE" / "QUIERO UN SERVICIO" / "QUIERO CONTRATAR"
  const isServiceRequest =
    /want a service|need a service|get a service|hire a service|looking for a service|booking a service|quiero un servicio|necesito un servicio|quisiera un servicio|quiero contratar|deseo un servicio|busco un servicio|quiero contratar el|quiero un corte|quiero atender|interesa un servicio|interesado en un servicio|ich möchte einen service|je veux un service/i.test(s);

  if (isServiceRequest) {
    return {
      text: lang === "en"
        ? `🐾 **Wonderful decision! We would be delighted to pamper your pooch right at your doorstep.**\n\nThe Fresh Pooch brings our 100% cage-free luxury mobile spa trailer directly to your driveway across Toronto. Here are our main doorstep experiences:\n\n🛁 **1. Bath & Tidy ($105–$155 CAD):** Ideal if you only need a deep botanical bath, 100% cage-free hand blow-dry, nail buffing, ear cleansing, and de-shedding (no body haircut).\n\n✂️ **2. Premium Full Groom ($145–$185 CAD):** Our most popular service; includes warm bath, hand dry, and a **custom scissor breed haircut**.\n\n🌟 **3. The Ultimate Pooch Spa & Cut ($195–$235 CAD):** The royal treatment with deep de-shedding blowout, artisan scissor styling, winter salt paw balm, and Organic Blueberry Facial.\n\n🎁 **Welcome Privilege:** Use code **\`TORONTOFRESH15\`** for **15% OFF** your first appointment!\n\n👇 **Tap any package below to add it directly to your cart with 1 click:**`
        : `🐾 **¡Excelente decisión! Estaremos encantados de consentir a tu perrito en la puerta de tu hogar.**\n\nLlevamos nuestra van de spa de lujo 100% libre de jaulas directo a tu entrada en Toronto. Aquí tienes nuestras 3 experiencias principales para que elijas la ideal para tu peludito:\n\n🛁 **1. Bath & Tidy ($105–$155 CAD):** Para un baño tibio relajante, secado a mano sin jaulas, cepillado, uñas y oídos (sin corte de pelo corporal).\n\n✂️ **2. Premium Full Groom ($145–$185 CAD):** Nuestro servicio estrella más vendido; incluye baño tibio, secado a mano y **corte completo estilizado** según la raza.\n\n🌟 **3. The Ultimate Pooch Spa & Cut ($195–$235 CAD):** La experiencia de lujo total con deslanado profundo, corte a tijera de autor, bálsamo para patas y Facial de Arándanos Orgánico.\n\n🎁 **Tu beneficio:** Aplica el cupón **\`TORONTOFRESH15\`** para recibir un **15% de descuento** en tu primera cita + Facial de Arándanos GRATIS.\n\n👇 **Toca cualquier opción abajo para agregarla a tu carrito en 1 clic:**`,
      actionItems: [
        {
          id: "req-bath-tidy",
          name: "Bath & Tidy (Solo Baño)",
          price: 125,
          category: "package",
          icon: "🛁",
          badge: "Sin Corte",
          highlights: "Hidrobaño tibio, secado a mano sin jaulas, uñas y oídos",
        },
        {
          id: "req-full-groom",
          name: "Premium Full Groom",
          price: 145,
          category: "package",
          icon: "✂️",
          badge: "Más Vendido",
          highlights: "Corte completo estilizado a tijera, hidrobaño tibio y limado de uñas",
        },
        {
          id: "req-ultimate-spa",
          name: "The Ultimate Pooch Spa & Cut",
          price: 195,
          category: "package",
          icon: "✨",
          badge: "Lujo Total",
          highlights: "Deslanado profundo, corte de autor, Facial de Arándanos y Bálsamo",
        },
      ],
    };
  }

  // 5. DIFFERENCE BETWEEN SERVICES: "DIFERENCIA ENTRE BAÑO Y CORTE"
  const isAskingDifference =
    /diferencia|difference|vs\b|cu[aá]l es mejor|which is better|distin|en qu[eé] se diferencia/i.test(s);

  if (isAskingDifference) {
    return {
      text: lang === "en"
        ? `Here is the clear distinction between our doorstep spa services:\n\n• 🛁 **Bath & Tidy:** Focuses 100% on hygiene and coat restoration. Includes warm botanical hydrobath, hand fluff dry, deep brush-out, nail buffing, and ear cleaning. **There is NO body clipper or scissor haircut.**\n\n• ✂️ **Premium Full Groom:** Includes everything in Bath & Tidy **PLUS a full custom scissor haircut & styling** (e.g., Teddy Bear cut, Breed Standard profile, sanitary trim).\n\n• 🌟 **The Ultimate Pooch Spa:** Adds intensive high-power undercoat de-shedding, organic winter paw salt balm, and our signature Blueberry Facial.\n\n👇 **Choose your preferred service to add to cart:**`
        : `Aquí tienes la diferencia clara entre nuestras experiencias de spa:\n\n• 🛁 **Bath & Tidy:** Se enfoca 100% en higiene y salud del manto. Incluye hidrobaño tibio, secado a mano sin jaulas, deslanado, limado de uñas y oídos. **NO se corta el largo del pelo corporal.**\n\n• ✂️ **Premium Full Groom:** Incluye todo el Bath & Tidy **MÁS un corte de pelo completo estilizado** a tijera o máquina adaptado a la raza (ej. corte Teddy Bear, corte higiénico, perfilado).\n\n• 🌟 **The Ultimate Pooch Spa:** Agrega deslanado intensivo de alta potencia, bálsamo orgánico para patas contra la sal y Facial de Arándanos.\n\n👇 **Elige tu opción preferida para agregarla al carrito:**`,
      actionItems: [
        {
          id: "diff-bath-tidy",
          name: "Bath & Tidy (Solo Baño)",
          price: 125,
          category: "package",
          icon: "🛁",
          badge: "Sin Corte",
          highlights: "Hidrobaño tibio, secado a mano sin jaulas, uñas y oídos",
        },
        {
          id: "diff-full-groom",
          name: "Premium Full Groom",
          price: 145,
          category: "package",
          icon: "✂️",
          badge: "Con Corte Completo",
          highlights: "Corte completo de raza, baño y limado de uñas",
        },
      ],
    };
  }

  // 6. ALL SERVICES / FULL MENU
  const isAskingAllServices =
    /todos los servicios|qu[eé] servicios|qu[eé] ofrecen|all services|what services|full menu|catalog|servicios tienen|cu[aá]les son sus servicios/i.test(s);

  if (isAskingAllServices) {
    return {
      text: lang === "en"
        ? `Here is our complete Toronto mobile dog spa menu:\n\n1️⃣ 🛁 **Bath & Tidy ($105–$155 CAD):** Essential hygiene without haircut.\n2️⃣ ✂️ **Premium Full Groom ($145–$185 CAD):** Custom breed scissor styling + bath & nails.\n3️⃣ 🌟 **The Ultimate Pooch Spa & Cut ($195–$235 CAD):** Deep de-shedding, scissor haircut, Blueberry Facial & paw balm.\n4️⃣ 🫐 **Add-ons:** Organic Blueberry Facial ($15), Winter Paw Balm ($12), Enzymatic Teeth Brushing ($15).\n\n🎁 **Code:** **\`TORONTOFRESH15\`** gets you **15% OFF**!\n\n👇 **Add any package below directly to your cart:**`
        : `Aquí tienes nuestro menú completo de spa canino móvil en Toronto:\n\n1️⃣ 🛁 **Bath & Tidy ($105–$155 CAD):** Higiene esencial y baño profundo sin corte de pelo.\n2️⃣ ✂️ **Premium Full Groom ($145–$185 CAD):** Corte completo de raza a tijera, hidrobaño y uñas.\n3️⃣ 🌟 **The Ultimate Pooch Spa & Cut ($195–$235 CAD):** Deslanado intensivo, corte de autor, Facial de Arándanos y bálsamo.\n4️⃣ 🫐 **Tratamientos Extra:** Facial de Arándanos ($15), Bálsamo de Patas ($12), Cepillado Dental ($15).\n\n🎁 **Cupón:** **\`TORONTOFRESH15\`** para un **15% de descuento**.\n\n👇 **Agrega cualquier opción abajo directamente al carrito:**`,
      actionItems: [
        {
          id: "menu-bath-tidy",
          name: "Bath & Tidy",
          price: 125,
          category: "package",
          icon: "🛁",
          badge: "Higiene Esencial",
          highlights: "Hidrobaño tibio, secado a mano, uñas y oídos",
        },
        {
          id: "menu-full-groom",
          name: "Premium Full Groom",
          price: 145,
          category: "package",
          icon: "✂️",
          badge: "Corte Completo",
          highlights: "Corte estilizado a tijera, hidrobaño y uñas",
        },
        {
          id: "menu-ultimate-spa",
          name: "The Ultimate Pooch Spa & Cut",
          price: 195,
          category: "package",
          icon: "✨",
          badge: "Lujo Total",
          highlights: "Deslanado profundo, corte, facial y bálsamo",
        },
      ],
    };
  }

  // 7. CAGE-FREE PHILOSOPHY / ZERO CAGES
  const isAskingCages = /jaula|jaulas|cage|cages|sin jaula|cage free|enjaul/i.test(s);
  if (isAskingCages) {
    return {
      text: lang === "en"
        ? `🐾 **We have a strict 100% Zero-Cage policy!**\n\nAt The Fresh Pooch, your dog is NEVER placed in a crate or cage. Traditional salons keep pets in cages for 4+ hours around barking, anxious dogs. In our luxury mobile spa van:\n\n• Your pooch is the **ONLY dog** inside during their session.\n• They receive **100% dedicated 1-on-1 attention** from their certified stylist.\n• We use gentle hand fluff drying only — absolutely NO heated cage box dryers.\n• The entire session takes just 60 to 90 minutes right outside your front door!`
        : `🐾 **¡Tenemos una política estricta de 100% Cero Jaulas!**\n\nEn The Fresh Pooch tu perrito NUNCA entra a una jaula ni caja transportadora. Las peluquerías tradicionales encierran a los perros durante 4 o 5 horas rodeados de ladridos y estrés. Con nosotros:\n\n• Tu perrito es el **ÚNICO perro** dentro de la van durante toda la sesión.\n• Recibe **atención 100% personalizada 1-a-1** con su estilista certificado.\n• Secado suave a mano con turbina regulada — jamás secadores automáticos de jaula.\n• La sesión dura solo 60 a 90 minutos frente a tu puerta y regresa relajado a casa.`,
    };
  }

  // 8. MOBILE SPA / AT HOME / DRIVEWAY
  const isAskingAtHome =
    /a domicilio|en mi casa|vienen a mi|puerta|driveway|curbside|come to my|at my house|a casa|frente a mi/i.test(s);
  if (isAskingAtHome) {
    return {
      text: lang === "en"
        ? `🚐 **Yes! We come directly to your driveway or curbside across Toronto & the GTA!**\n\nOur custom Mercedes Sprinter mobile spa is 100% self-sufficient:\n• Heated fresh water tank on board (we do NOT need to hook up to your garden hose).\n• Quiet solar and lithium battery power (no loud fumes or noisy engines).\n• Climate-controlled with winter heating and summer AC.\n\nYou never have to drive in Toronto traffic or wait in a salon lobby again! 🐾`
        : `🚐 **¡Sí! Vamos directamente a la entrada de tu casa o condominio en Toronto y todo el GTA!**\n\nNuestra van de spa móvil Mercedes es 100% autosuficiente:\n• Tanque propio de agua tibia a temperatura regulada (NO usamos tu manguera ni agua).\n• Energía silenciosa por batería de litio y panel solar (sin ruido de generador ni humos).\n• Climatizada con calefacción en invierno y aire acondicionado en verano.\n\n¡Te olvidas del tráfico de Toronto y de dejar a tu perro esperando en una peluquería! 🐾`,
    };
  }

  // 9. NERVOUS / SENIOR / REACTIVE DOGS
  const isAskingTemperament =
    /nervios|miedo|asusta|agresiv|morder|viejit|ancian|senior|nervous|anxious|scared|aggressive|reactive|bite/i.test(s);
  if (isAskingTemperament) {
    return {
      text: lang === "en"
        ? `❤️ **We specialize in nervous, sensitive, and senior dogs!**\n\nBecause our mobile spa is a private 1-on-1 space with zero other dogs barking, anxiety drops by over 80%. Our groomers are certified in **Fear-Free handling** techniques:\n• We take breaks whenever your dog needs to relax.\n• Low-stress hydraulic tables for gentle entry for seniors with arthritis.\n• Quiet hydro-massage bathing and adjustable-speed drying.\n\nTell us about your pup's special sensitivities and we'll ensure the gentlest experience possible.`
        : `❤️ **¡Nos especializamos en perritos nerviosos, asustadizos y de la tercera edad (seniors)!**\n\nAl ser un espacio privado 1-a-1 sin otros perros ladrando alrededor, el estrés se reduce más del 80%. Nuestras peluqueras están certificadas en manejo **Fear-Free**:\n• Hacemos pausas de calma y caricias siempre que tu perro lo necesite.\n• Mesa hidráulica de bajo impacto para perritos seniors con displasia o artritis.\n• Hidromasaje silencioso y secado con control de velocidad para no asustarlos.\n\nCuéntanos qué le asusta a tu peludito y lo atenderemos con total paciencia y amor.`,
    };
  }

  // 10. PRESENCE / CAN I WATCH?
  const isAskingPresence =
    /puedo estar|puedo ver|puedo mirar|estar presente|can i watch|can i stay|be present|look in/i.test(s);
  if (isAskingPresence) {
    return {
      text: lang === "en"
        ? `👀 You are welcome to inspect our sparkling mobile spa van before the appointment and meet your certified groomer! During the groom, pets usually stay calmer without owners standing directly at the window (to prevent over-excitement), but you can peek through the large window anytime and we send digital photo updates! 🐾`
        : `👀 ¡Por supuesto! Puedes subir a la van antes de iniciar, conocer a la peluquera y ver nuestras instalaciones impecables. Durante el baño, los perritos suelen estar más serenos si no ven a sus dueños pegados al vidrio (evita que se sobreexciten), pero puedes asomarte cuando gustes y te enviamos fotos en tiempo real. 🐾`,
    };
  }

  // 11. DURATION / HOW LONG DOES IT TAKE?
  const isAskingDuration =
    /cuanto dura|cuanto tarda|cuanto demora|tiempo|how long|duration|tarda mucho/i.test(s);
  if (isAskingDuration) {
    return {
      text: lang === "en"
        ? `⏱️ Because we provide dedicated 1-on-1 service with zero cage waiting, a full appointment takes only **60 to 90 minutes** (compared to 4–5 hours in a traditional grooming salon). Once finished, your pooch is delivered straight back into your warm home happy and smelling wonderful!`
        : `⏱️ Al brindar atención continua 1-a-1 sin interrupciones, una sesión completa dura solo entre **60 y 90 minutos** (frente a las 4 a 5 horas que pasa un perro esperando en una peluquería tradicional). En cuanto terminamos, te lo entregamos de inmediato en la puerta de tu hogar feliz y oliendo delicioso.`,
    };
  }

  // 12. PAYMENT METHODS
  const isAskingPayments =
    /m[eé]todo de pago|como pago|como se paga|tarjeta|efectivo|payment method|how to pay|apple pay|interac/i.test(s);
  if (isAskingPayments) {
    return {
      text: lang === "en"
        ? `💳 **Canadian Payment Options:**\nWe accept **Apple Pay (1-tap)**, **Google Pay**, **Interac e-Transfer**, and all major credit cards (**Visa, Mastercard, American Express**). You can pay directly in this chat through our Express Checkout or tap your card at the van doorstep!`
        : `💳 **Métodos de pago aceptados en Canadá:**\nAceptamos **Apple Pay (1-clic)**, **Google Pay**, **Interac e-Transfer**, y todas las tarjetas de crédito (**Visa, Mastercard, American Express**). Puedes pagar directamente en este chat con nuestro Express Checkout o con tarjeta en la puerta de la van.`,
    };
  }

  // 13. DISCOUNTS / PROMOTIONS
  const isAskingDiscount =
    /descuento|promocion|promoción|promo|oferta|codigo|código|cup[oó]n|discount|coupon|special offer/i.test(s);
  if (isAskingDiscount) {
    return {
      text: lang === "en"
        ? `🎁 **Active Toronto Promotion:**\nUse coupon code **\`TORONTOFRESH15\`** to receive **15% OFF** your first appointment + a **FREE Organic Blueberry Facial** ($15 CAD value)! Simply enter the code at checkout or tap any service card below to apply it automatically.`
        : `🎁 **Promoción activa en Toronto:**\nAplica el código **\`TORONTOFRESH15\`** para obtener un **15% de descuento** en tu primera cita + un **Facial de Arándanos Orgánico GRATIS** ($15 CAD de valor). Puedes aplicarlo al pagar o tocar cualquier tarjeta de abajo para añadirlo a tu carrito.`,
      actionItems: [
        {
          id: "disc-full-groom",
          name: "Premium Full Groom",
          price: 145,
          category: "package",
          icon: "✂️",
          badge: "15% OFF con Cupón",
          highlights: "Corte completo de raza, hidrobaño tibio y limado de uñas",
        },
      ],
    };
  }

  // 14. TWO DOGS / MULTI-PET SIBLING DISCOUNT
  const isAskingMultipleDogs =
    /dos perros|2 perros|varios perros|two dogs|second pet|sibling/i.test(s);
  if (isAskingMultipleDogs) {
    return {
      text: lang === "en"
        ? `🐾 **Multi-Pet Sibling Privilege:**\nYes! When you book two or more dogs during the same doorstep visit in Toronto, the second pet receives an additional **10% sibling discount** on their package, plus their own Pet Passport report card!`
        : `🐾 **Beneficio para Hermanitos Caninos:**\n¡Sí! Cuando agendas dos o más perritos en la misma visita en tu domicilio en Toronto, el segundo perrito recibe un **10% de descuento adicional** en su paquete, además de su propio reporte digital.`,
    };
  }

  // 15. SUNDAYS & HOURS
  if (
    s.includes("sunday") || s.includes("domingo") || s.includes("hour") || s.includes("horario") || s.includes("open") || s.includes("abierto")
  ) {
    return {
      text: lang === "en"
        ? "Yes! We are proudly open **7 days a week, Monday through Sunday from 8:30 AM to 6:00 PM**. Weekends are our most popular times for stress-free doorstep grooming across Toronto, so your pooch gets pampered without disrupting your family schedule."
        : "¡Sí! Atendemos los **7 días de la semana, de lunes a domingo de 8:30 AM a 6:00 PM**. Los fines de semana son especialmente solicitados en Toronto para consentir a tu perro en la puerta de tu hogar sin que tengas que desplazarte.",
    };
  }

  // 16. LATCHKEY CONTACTLESS
  if (
    s.includes("latchkey") || s.includes("llave") || s.includes("lockbox") || s.includes("contactless")
  ) {
    return {
      text: lang === "en"
        ? `Our **Latchkey Service** is a game-changer for busy Toronto pet parents! 🔑\n\n1. Store your smart-lock or lockbox code in your portal (AES-256 encrypted).\n2. Code is revealed to the certified groomer ONLY when parked at your home.\n3. We groom your dog 1-on-1, return them safely inside, refill water, and send photo report cards immediately!\n\nOver 68% of our recurring Toronto clients use Latchkey every month. 🐾`
        : `¡Nuestro servicio **Latchkey** es la opción favorita de quienes trabajan desde casa o en la oficina! 🔑\n\n1. Guardas el código de tu lockbox o cerradura en tu portal de forma encriptada bajo AES-256.\n2. El código solo se revela en la tablet de la peluquera cuando la van se estaciona frente a tu puerta.\n3. Recogemos a tu perrito, lo atendemos 1-a-1, lo dejamos seguro en casa y te enviamos fotos del reporte de inmediato. 🐾`,
    };
  }

  // 17. VIP CLUB
  if (
    s.includes("vip") || s.includes("club") || s.includes("suscrip") || s.includes("subscri")
  ) {
    return {
      text: lang === "en"
        ? `Our **VIP Pooch Club** is designed for predictable, stress-free grooming:\n\n👑 **VIP Benefits:**\n• **15% Lifetime Discount** on every appointment.\n• **Free Organic Blueberry Facial** ($15 CAD Value) forever.\n• **Priority Weekend Slots** reserved for members.\n• **The Same Trusted Groomer** every single visit.\n• **Zero Cancellation Fees:** Free reschedules anytime!\n\nUse code **\`TORONTOFRESH15\`** to activate your 15% discount today! 🐾`
        : `¡El **Club VIP Pooch** es la mejor manera de consentir a tu perro todo el año ahorrando al máximo! 👑\n\n👑 **Beneficios:**\n• **15% de descuento permanente** en cada cita.\n• **Facial de Arándanos Orgánico GRATIS** de por vida.\n• **Horarios prioritarios de fin de semana**.\n• **El mismo peluquero de confianza siempre**.\n• **Cero penalizaciones por cancelación**.\n\nUsa el código **\`TORONTOFRESH15\`** para disfrutar tu 15% de descuento hoy. 🐾`,
    };
  }

  // 18. SMART PRICING & SPECIFIC BREED QUOTE WITH 1-CLICK ACTION CARDS
  const isAskingPrice =
    s.includes("cuanto") || s.includes("cuánto") || s.includes("costar") || s.includes("precio") ||
    s.includes("cost") || s.includes("price") || s.includes("rate") || s.includes("quote") ||
    s.includes("tarif") || s.includes("preis") || s.includes("kosten") || s.includes("how much");

  // The breed may come from an earlier message, but the request for a quote must be in this one;
  // otherwise every later question ("Hola", "which areas?") repeated the previous quote.
  // Giant breeds have no dedicated quote card; they get the general table below, which lists the giant tier.
  if (
    entities.breed &&
    entities.breedTier !== "giant" &&
    (isAskingPrice || currentEntities.isBathOnly || currentEntities.isFullGroom)
  ) {
    const breedName = entities.breed;
    const locTextEn = entities.location ? `in **${entities.location}**` : "in Toronto";
    const locTextEs = entities.location ? `en **${entities.location}**` : "en Toronto";

    let scheduleNoteEn = "Our mobile spa visits Downtown Toronto (King West route) every **Monday**.";
    let scheduleNoteEs = "Nuestro spa móvil visita Downtown Toronto (ruta de King West) todos los **lunes**.";
    if (entities.location === "Midtown Toronto") {
      scheduleNoteEn = "Our mobile spa trailer is in Midtown every **Wednesday**.";
      scheduleNoteEs = "Nuestro spa móvil está en Midtown todos los **miércoles**.";
    }

    if (entities.breedTier === "large") {
      return {
        text: lang === "en"
          ? `🐾 **Exact Quote for your ${breedName} ${locTextEn}:**\n\n${breedName}s (typically 55–75 lbs) feature a heavy double coat that thrives with our warm hydro-bath and de-shedding treatment:\n\n• 🛁 **Hydro-Bath & De-Shedding (Bath & Tidy):** **$155–$175 CAD**\n  *Includes:* Warm organic hydrobath with blueberry wash, high-velocity undercoat blowout (100% cage-free hand-drying), thorough brush-out of dead fur, nail clipping & dremel buffing, antiseptic ear cleansing, and pad tidy.\n\n• ✂️ **The Ultimate Pooch Spa & Scissor Styling:** **$195–$225 CAD**\n  *Includes:* Everything in Hydro-Bath plus full hand scissor outline, leg feather trimming, tail shaping, sanitary hygiene trim, and organic winter paw salt balm.\n\n📍 **Neighborhood Schedule:** ${scheduleNoteEn}\n\n🎁 **Welcome Privilege:** Use code **\`TORONTOFRESH15\`** for **15% OFF** + Free Blueberry Facial!\n\n👇 **Add your service to cart with 1 click below:**`
          : `🐾 **Cotización exacta para tu ${breedName} ${locTextEs}:**\n\nLos ${breedName} son perros grandes (típicamente 55–75 lbs) con manto denso que agradece enormemente el hidro-baño y deslanado:\n\n• 🛁 **Hidro-Baño & Deslanado Profundo (Solo Baño & Higiene):** **$155–$175 CAD**\n  *Incluye:* Hidrobaño tibio orgánico, deslanado de alta potencia para retirar todo el pelo muerto suelto, secado suave a mano 100% sin jaulas, corte y limado de uñas, limpieza antiséptica de oídos y arreglo de almohadillas.\n\n• ✂️ **The Ultimate Pooch Spa & Corte:** **$195–$225 CAD**\n  *Incluye:* Todo el baño y deslanado más perfilado a tijera de plumas en patas, pecho y cola, corte higiénico y bálsamo orgánico para patas contra la sal de aceras.\n\n📍 **Ruta en tu zona:** ${scheduleNoteEs}\n\n🎁 **Beneficio de bienvenida:** Aplica el cupón **\`TORONTOFRESH15\`** para obtener **15% de descuento** en tu primera cita + un **Facial de Arándanos Orgánico GRATIS** ($15 CAD).\n\n👇 **Agrega el servicio directamente a tu carrito con 1 clic:**`,
        actionItems: [
          {
            id: `bath-shed-${breedName.toLowerCase().replace(/\s+/g, "-")}`,
            name: `Hydro-Bath & De-Shedding (${breedName})`,
            price: 155,
            category: "package",
            icon: "🛁",
            badge: "Recomendado para Manto",
            highlights: "Hidrobaño tibio, deslanado profundo, oídos y limado de uñas",
            breed: breedName,
          },
          {
            id: `ultimate-spa-${breedName.toLowerCase().replace(/\s+/g, "-")}`,
            name: `The Ultimate Pooch Spa & Cut (${breedName})`,
            price: 195,
            category: "package",
            icon: "✨",
            badge: "Lujo Total",
            highlights: "Perfilado a tijera, Facial de Arándanos y Bálsamo de Patas",
            breed: breedName,
          },
          {
            id: "blueberry-facial-addon",
            name: "Organic Blueberry Facial",
            price: 15,
            category: "addon",
            icon: "🫐",
            badge: "GRATIS con Cupón",
            highlights: "Limpieza facial de lágrimas y fragancia botánica",
          },
        ],
      };
    }

    if (entities.breedTier === "small") {
      return {
        text: lang === "en"
          ? `🐾 **Exact Quote for your ${breedName} ${locTextEn}:**\n\nSmall pups (<20 lbs) receive our gentle 1-on-1 hand care:\n\n• 🛁 **Bath & Tidy Express:** **$105–$125 CAD**\n• ✂️ **The Ultimate Pooch Spa & Full Scissor Cut:** **$135–$155 CAD**\n\n🎁 **Welcome Privilege:** Use code **\`TORONTOFRESH15\`** for **15% OFF**!\n\n👇 **Choose your service below to add to cart:**`
          : `🐾 **Cotización exacta para tu ${breedName} ${locTextEs}:**\n\nPara perritos pequeños (<20 lbs):\n\n• 🛁 **Bath & Tidy (Baño & Arreglo Express):** **$105–$125 CAD**\n• ✂️ **The Ultimate Pooch Spa & Corte Completo:** **$135–$155 CAD**\n\n🎁 **Beneficio de bienvenida:** Cupón **\`TORONTOFRESH15\`** con **15% de descuento**.\n\n👇 **Elige tu servicio para agregarlo al carrito:**`,
        actionItems: [
          {
            id: `bath-tidy-${breedName.toLowerCase().replace(/\s+/g, "-")}`,
            name: `Bath & Tidy Express (${breedName})`,
            price: 105,
            category: "package",
            icon: "🛁",
            badge: "Express Care",
            highlights: "Gentle organic wash, tear-stain facial, nail buff",
            breed: breedName,
          },
          {
            id: `ultimate-spa-${breedName.toLowerCase().replace(/\s+/g, "-")}`,
            name: `The Ultimate Pooch Spa & Cut (${breedName})`,
            price: 135,
            category: "package",
            icon: "✂️",
            badge: "Full Scissor Cut",
            highlights: "Artisan haircut, warm hydrobath & organic paw balm",
            breed: breedName,
          },
        ],
      };
    }

    // Medium breeds default
    return {
      text: lang === "en"
        ? `🐾 **Exact Quote for your ${breedName} ${locTextEn}:**\n\nMedium pups (20–45 lbs) receive our dedicated 1-on-1 session:\n\n• 🛁 **Bath & Tidy:** **$125–$145 CAD**\n• ✂️ **Premium Full Groom & Scissor Cut:** **$155–$185 CAD**\n\n🎁 **Welcome Privilege:** Code **\`TORONTOFRESH15\`** gives **15% OFF** + Free Blueberry Facial!\n\n👇 **Add directly to cart below:**`
        : `🐾 **Cotización exacta para tu ${breedName} ${locTextEs}:**\n\nPara perros medianos (20–45 lbs):\n\n• 🛁 **Bath & Tidy:** **$125–$145 CAD**\n• ✂️ **Premium Full Groom & Corte Completo:** **$155–$185 CAD**\n\n🎁 **Beneficio de bienvenida:** Cupón **\`TORONTOFRESH15\`** para un **15% de descuento**.\n\n👇 **Agrega el servicio directamente a tu carrito:**`,
      actionItems: [
        {
          id: `bath-tidy-${breedName.toLowerCase().replace(/\s+/g, "-")}`,
          name: `Bath & Tidy (${breedName})`,
          price: 125,
          category: "package",
          icon: "🛁",
          badge: "Essential",
          highlights: "Warm hydrobath, hand fluff dry, ear & pad tidy",
          breed: breedName,
        },
        {
          id: `full-groom-${breedName.toLowerCase().replace(/\s+/g, "-")}`,
          name: `Premium Full Groom & Cut (${breedName})`,
          price: 155,
          category: "package",
          icon: "✂️",
          badge: "Most Popular",
          highlights: "Custom scissor haircut (Teddy Bear), warm hydrobath",
          breed: breedName,
        },
        {
          id: "paw-balm-addon",
          name: "Winter Road Salt Paw Balm",
          price: 12,
          category: "addon",
          icon: "🐾",
          badge: "Winter Essential",
          highlights: "Organic beeswax barrier against sidewalk salt",
        },
      ],
    };
  }

  // 18b. SERVICE AREAS & ROUTE DAYS (same route days as the owner dashboard zones)
  const isAskingAreas =
    /(?<!\p{L})(zonas?|[aá]reas?|barrios?|vecindarios?|neighbou?rhoods?|cubren|cobertura|cover|service area)(?!\p{L})/iu.test(s) ||
    /qu[eé] d[ií]as?|which days?|what days?|pasa(n)? por|when do you (come|visit|go)|route day/iu.test(s);
  if (isAskingAreas) {
    const routeDays: Record<string, { en: string; es: string }> = {
      "Downtown Toronto": { en: "Mondays (King West route)", es: "los lunes (ruta de King West)" },
      "Midtown Toronto": { en: "Wednesdays", es: "los miércoles" },
      "The Annex": { en: "Tuesdays (and Christie Pits on Fridays)", es: "los martes (y Christie Pits los viernes)" },
      "Rosedale / Forest Hill": { en: "Thursdays", es: "los jueves" },
      "The Beaches / Leslieville": { en: "Saturdays", es: "los sábados" },
    };
    const day = entities.location ? routeDays[entities.location] : undefined;
    const tableEn =
      "• **King West / Downtown:** Mondays\n• **The Annex:** Tuesdays\n• **Midtown:** Wednesdays\n• **Rosedale:** Thursdays\n• **Christie Pits:** Fridays\n• **The Beaches:** Saturdays";
    const tableEs =
      "• **King West / Downtown:** lunes\n• **The Annex:** martes\n• **Midtown:** miércoles\n• **Rosedale:** jueves\n• **Christie Pits:** viernes\n• **The Beaches:** sábados";

    if (day) {
      return {
        text: lang === "en"
          ? `🚐 Our mobile spa is in **${entities.location}** on **${day.en}**.\n\nHere is the full weekly route:\n${tableEn}\n\nWe also visit East York, Etobicoke, North York, Leaside and more of the GTA. Share your postal code and I'll confirm your exact day! 🐾`
          : `🚐 Nuestro spa móvil pasa por **${entities.location}** **${day.es}**.\n\nEsta es la ruta completa de la semana:\n${tableEs}\n\nTambién vamos a East York, Etobicoke, North York, Leaside y más zonas del GTA. Dime tu código postal y te confirmo tu día exacto. 🐾`,
      };
    }
    return {
      text: lang === "en"
        ? `📍 **We groom across Toronto and the GTA.** Our weekly route:\n${tableEn}\n\nWe also visit East York, Etobicoke, North York, Leaside, Mississauga, Markham, Scarborough and Richmond Hill. Share your postal code and I'll confirm your day! 🐾`
        : `📍 **Atendemos en todo Toronto y el GTA.** Esta es la ruta de la semana:\n${tableEs}\n\nTambién vamos a East York, Etobicoke, North York, Leaside, Mississauga, Markham, Scarborough y Richmond Hill. Dime tu código postal y te confirmo tu día. 🐾`,
    };
  }

  // 18c. VACCINES REQUIRED
  if (/vacun|vaccin|rabia|rabies|bordetella|dhpp/i.test(s)) {
    return {
      text: lang === "en"
        ? `🩺 **Vaccines we ask for before every visit:**\n\n• **Rabies:** required by law in Ontario.\n• **DHPP** (distemper, hepatitis, parvovirus, parainfluenza).\n• **Bordetella** (kennel cough).\n\nUpload your vet certificate in your **Pet Parent Portal** (Vaccine Reminders). We'll alert you before a booster is due so your appointments are never delayed. 🐾`
        : `🩺 **Vacunas que pedimos antes de cada visita:**\n\n• **Rabia:** obligatoria por ley en Ontario.\n• **DHPP** (moquillo, hepatitis, parvovirus y parainfluenza).\n• **Bordetella** (tos de las perreras).\n\nSube el certificado del veterinario en tu **Portal del cliente** (Vaccine Reminders). Te avisamos antes de que venza un refuerzo para que tus citas nunca se retrasen. 🐾`,
    };
  }

  // 19. GENERAL PRICING QUERY
  if (isAskingPrice) {
    return {
      text: lang === "en"
        ? `Here is our transparent, all-inclusive pricing by weight tier across Toronto:\n\n• **Small Pups (<20 lbs):** $120–$140 CAD (or $105 CAD for Bath & Tidy).\n• **Medium Pups (20–45 lbs):** $145–$185 CAD (or $125 CAD for Bath & Tidy).\n• **Large Pups (45–75 lbs):** $185–$225 CAD (or $155 CAD for Bath & Tidy).\n• **Giant Pups (76+ lbs):** $215–$260 CAD.\n\n✨ **Every appointment includes:** Warm botanical hydrobath, gentle hand blow-dry (zero cages), custom scissor styling, nail clipping & buffing, ear cleansing, and an Organic Blueberry Facial.\n\n🎁 **Welcome Code:** **\`TORONTOFRESH15\`** for **15% OFF**!\n\n👇 **Select a package to start your cart:**`
        : `Nuestras tarifas transparentes todo incluido según el tamaño de tu perro en Toronto:\n\n• **Perros Pequeños (<20 lbs):** $120–$140 CAD (o $105 CAD solo Bath & Tidy).\n• **Perros Medianos (20–45 lbs):** $145–$185 CAD (o $125 CAD solo Bath & Tidy).\n• **Perros Grandes (45–75 lbs):** $185–$225 CAD (o $155 CAD solo baño y deslanado).\n• **Perros Gigantes (76+ lbs):** $215–$260 CAD.\n\n✨ **Todo incluido frente a tu puerta:** Hidrobaño tibio orgánico, secado suave a mano 100% sin jaulas, corte estilizado a tijera, corte y limado de uñas, limpieza de oídos y arreglo higiénico.\n\n🎁 **Cupón:** **\`TORONTOFRESH15\`** para **15% de descuento**.\n\n👇 **Selecciona un servicio para agregarlo al carrito:**`,
      actionItems: [
        {
          id: "pkg-full-groom",
          name: "Premium Full Groom",
          price: 145,
          category: "package",
          icon: "✂️",
          badge: "Most Popular",
          highlights: "Custom scissor styling, warm hydrobath, ear & nail care",
        },
        {
          id: "pkg-ultimate-spa",
          name: "The Ultimate Pooch Spa & Cut",
          price: 195,
          category: "package",
          icon: "✨",
          badge: "Royal Luxury",
          highlights: "De-shedding blowout, scissor haircut & Blueberry Facial",
        },
      ],
    };
  }

  // 20. BOOKING INTENT
  if (
    s.includes("agend") || s.includes("reserv") || s.includes("contrat") || s.includes("cita") ||
    s.includes("turno") || s.includes("book") || s.includes("schedul") || s.includes("appointment")
  ) {
    return {
      text: lang === "en"
        ? `🐾 **I'd love to get your pooch scheduled right away!** Booking our luxury mobile van takes under 60 seconds:\n\n1️⃣ **Choose your package:** Tap an option below to add to your cart.\n2️⃣ **Your location:** We service Midtown (Wednesdays), The Annex (Tuesdays), Rosedale (Thursdays), Downtown (Mondays), and all Toronto neighborhoods.\n\n🎁 **Welcome Privilege:** Use code **\`TORONTOFRESH15\`** for **15% OFF** + Free Organic Blueberry Facial!\n\n👇 **Click to add to cart and proceed to instant checkout:**`
        : `🐾 **¡Será un verdadero placer consentir a tu perrito!** Agendar tu cita de spa móvil en Toronto es súper rápido y 100% digital:\n\n1️⃣ **Elige tu experiencia:** Toca una opción abajo para agregar a tu carrito.\n2️⃣ **Tu zona:** Atendemos Midtown (miércoles), The Annex (martes), Rosedale (jueves), Downtown (lunes), Beaches (sábados) y todo el GTA.\n\n🎁 **Beneficio de bienvenida:** Aplica el cupón **\`TORONTOFRESH15\`** para **15% de descuento** + Facial de Arándanos GRATIS.\n\n👇 **Toca para agregar a tu carrito y completar el pago:**`,
      actionItems: [
        {
          id: "book-full-groom",
          name: "Premium Full Groom",
          price: 145,
          category: "package",
          icon: "✂️",
          badge: "Full Care",
          highlights: "Custom breed haircut, warm hydrobath, nail buffing",
        },
        {
          id: "book-ultimate-spa",
          name: "The Ultimate Pooch Spa & Cut",
          price: 195,
          category: "package",
          icon: "✨",
          badge: "Best Overall",
          highlights: "Royal treatment with de-shedding & organic facial",
        },
      ],
    };
  }

  // 21. BEST SERVICE RECOMMENDATION
  if (
    s.includes("mejor") || s.includes("recomiend") || s.includes("best") || s.includes("recommend")
  ) {
    return {
      text: lang === "en"
        ? `For the absolute finest, stress-free pampering in Toronto, here is our top recommendation:\n\n🌟 **1. The Ultimate Pooch Spa & Cut ($195–$235 CAD):** The royal treatment: warm hydrobath, de-shedding blowout, custom scissor styling, paw balm, and Blueberry Facial.\n\n✂️ **2. Premium Full Groom ($145–$185 CAD):** Our most popular service: custom haircut, bath, ear cleansing, and nail buffing.\n\n👇 **Add your favorite package directly to cart:**`
        : `¡Para que tu perrito viva una experiencia de spa inolvidable sin una gota de estrés, te recomendamos:\n\n🌟 **1. The Ultimate Pooch Spa & Cut ($195–$235 CAD):** El tratamiento estrella con deslanado profundo, corte a tijera de autor, bálsamo para patas y Facial de Arándanos.\n\n✂️ **2. Premium Full Groom ($145–$185 CAD):** Nuestro servicio más vendido con corte completo, hidrobaño tibio y limado de uñas.\n\n👇 **Agrega tu paquete preferido directamente al carrito:**`,
      actionItems: [
        {
          id: "rec-ultimate-spa",
          name: "The Ultimate Pooch Spa & Cut",
          price: 195,
          category: "package",
          icon: "✨",
          badge: "Best Overall",
          highlights: "De-shedding + scissor styling, Blueberry Facial & Paw Balm",
        },
        {
          id: "rec-full-groom",
          name: "Premium Full Groom",
          price: 145,
          category: "package",
          icon: "✂️",
          badge: "Most Popular",
          highlights: "Custom breed haircut, warm hydrobath, nail buffing",
        },
      ],
    };
  }

  // 22. COURTEOUS GREETINGS & TIME-OF-DAY SALUTATIONS (when standalone)
  if (
    /^(good night|good evening|buenas noches|bonsoir|guten abend)\b/i.test(s) ||
    s === "good night" || s === "buenas noches" || s === "good evening"
  ) {
    return {
      text: lang === "en"
        ? `Good evening! 🌙 How are you and your pooch doing tonight? How may I assist you with our Toronto luxury mobile spa? Are you looking to schedule a doorstep appointment or get a quote for your dog's breed? 🐾`
        : `¡Buenas noches! 🌙 ¿Cómo se encuentran tú y tu perrito esta noche? ¿Cómo puedo ayudarte hoy con nuestro spa canino móvil en Toronto? ¿Deseas cotizar su corte o agendar una cita para esta semana? 🐾`,
    };
  }

  if (
    /^(good morning|buenos dias|buenos días|bonjour|guten morgen)\b/i.test(s) ||
    s === "good morning" || s === "buenos dias" || s === "buenos días"
  ) {
    return {
      text: lang === "en"
        ? `Good morning! ☀️ Hope you and your pup are having a wonderful start to the day. How may I assist you with our Toronto mobile spa today?`
        : `¡Buenos días! ☀️ Espero que tú y tu perrito tengan un excelente inicio de día. ¿En qué puedo colaborarles hoy con nuestro spa móvil en Toronto?`,
    };
  }

  if (
    /^(good afternoon|buenas tardes|bon après-midi|bon apres midi|guten tag)\b/i.test(s) ||
    s === "good afternoon" || s === "buenas tardes"
  ) {
    return {
      text: lang === "en"
        ? `Good afternoon! 🌤️ How are you and your pup doing today? How may I assist you with our Toronto mobile spa?`
        : `¡Buenas tardes! 🌤️ ¿Cómo están tú y tu perrito hoy? ¿En qué puedo ayudarte con nuestro servicio de grooming móvil en Toronto?`,
    };
  }

  if (
    s.includes("how are you") || s.includes("como estas") || s.includes("cómo estás") ||
    s.includes("como te va") || s.includes("cómo te va")
  ) {
    return {
      text: lang === "en"
        ? `I'm doing wonderful, thank you so much for asking! 🐾 Ready to make sure your pooch gets the finest cage-free pampering in Toronto. How are you and your furry friend doing today?`
        : `¡Excelente, muchas gracias por preguntar! 🐾 Listo para consentir a tu perrito con el mejor servicio móvil 100% libre de jaulas de Toronto. ¿Cómo se encuentran hoy tú y tu peludito?`,
    };
  }

  // Only a bare greeting gets the welcome reply; "Hola, ¿...?" with a real question must not be answered with a greeting.
  const isBareGreeting = (s.match(/\p{L}+/gu) ?? []).length <= 4;
  if (
    isBareGreeting &&
    (/^(hi|hello|hey|howdy)\b/i.test(s) ||
      /^(hola|que tal|qué tal|buenas)\b/i.test(s))
  ) {
    return {
      text: lang === "en"
        ? userName
          ? `Hello ${userName}! 👋 It's wonderful to see you again! How is ${petName || "your pooch"} doing today? Are you looking to book your next doorstep groom, check your vaccine status, or customize styling? 🐾`
          : `Hello there! 👋 I'm **Qimmiq**, your personal concierge at **The Fresh Pooch Toronto**. How are you and your pup doing today?\n\nI can give you an instant quote for your dog's breed, check what days our mobile spa is in your neighborhood, or help you book a 1-on-1 cage-free session.\n\n✨ *Tip:* You can create a free Pet Parent profile to get your dog's digital Pet Passport (#FP-ID) and unlock **15% off** (\`TORONTOFRESH15\`) your first visit!`
        : userName
        ? `¡Hola ${userName}! 👋 ¡Qué gusto saludarte de nuevo! ¿Cómo está ${petName || "tu perrito"} hoy? ¿Te gustaría agendar su próximo corte de spa, revisar sus vacunas o agregar un tratamiento facial? 🐾`
        : `¡Hola! 👋 Soy **Qimmiq**, tu asistente y conserje personal en **The Fresh Pooch Toronto**. ¿Cómo están tú y tu perrito hoy?\n\nPuedo darte una cotización exacta para la raza de tu perro, decirte qué días estamos en tu vecindario o ayudarte a agendar una cita de spa móvil 100% libre de jaulas.\n\n✨ *Consejo:* Puedes registrarte gratis para obtener el Pasaporte Digital (#FP-ID) de tu mascota y desbloquear un **15% de descuento** (\`TORONTOFRESH15\`) en tu primera visita.`,
    };
  }

  // 23. ADAPTIVE, NON-REPEATING CONSULTATIVE FALLBACKS
  const fallbackVariationsEn = [
    `🐾 I'd be delighted to assist you! Would you like an exact quote for your dog's breed, or would you like to know which days our mobile spa trailer visits your Toronto neighborhood? (Don't forget code **\`TORONTOFRESH15\`** gives you **15% OFF**!)`,
    `✨ At The Fresh Pooch, every session is 100% cage-free and personalized 1-on-1. Tell me your dog's breed and approximate weight, or your Toronto postal code, and I'll find the perfect route slot for you!`,
    `🐾 How can I best pamper your furry best friend today? You can ask me about our **Bath & Tidy** package, full scissor haircuts, our contactless **Latchkey** service, or book directly in this chat!`,
  ];

  const fallbackVariationsEs = [
    `🐾 ¡Será un placer orientarte! ¿Te gustaría una cotización exacta para la raza de tu perrito, o deseas saber qué días visita la van tu vecindario de Toronto? (Recuerda que con el cupón **\`TORONTOFRESH15\`** tienes **15% de descuento**).`,
    `✨ En The Fresh Pooch todas nuestras visitas son 100% libres de jaulas frente a tu puerta. Cuéntame la raza o peso aproximado de tu perro, o tu zona en Toronto, y con gusto te doy la tarifa exacta y disponibilidad.`,
    `🐾 ¿Cómo puedo consentir a tu consentido hoy? Puedes preguntarme sobre nuestro paquete de **Bath & Tidy (solo baño)**, cortes completos a tijera, el servicio **Latchkey** sin contacto o agendar directamente aquí en el chat.`,
  ];

  const idx = turnCount % 3;
  return {
    text: lang === "en" ? fallbackVariationsEn[idx] : fallbackVariationsEs[idx],
  };
}

/**
 * Renders the light markdown used in Qimmiq replies (**bold**, *italic*, `code`)
 * instead of showing the raw asterisks and backticks.
 */
function renderInlineMarkdown(text: string, keyPrefix = "md"): ReactNode[] {
  const parts = text.split(/(\*\*[\s\S]+?\*\*|`[^`\n]+`|\*[^*\n]+?\*)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key} className="font-bold">{renderInlineMarkdown(part.slice(2, -2), key)}</strong>;
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] font-semibold">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{renderInlineMarkdown(part.slice(1, -1), key)}</em>;
    }
    return part;
  });
}

export function QimmiqAssistant({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(isAdmin ? "admin" : "client");
  const [convLang, setConvLang] = useState<Lang>("en");
  const [turnCount, setTurnCount] = useState<number>(0);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState(false);
  const lastEntitiesRef = useRef<ExtractedEntities>({});

  // Cart & Checkout state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"review" | "success">("review");
  const [paymentMethod, setPaymentMethod] = useState<"apple_pay" | "google_pay" | "card" | "interac">("apple_pay");
  const [checkoutAddress, setCheckoutAddress] = useState("142 Bloor St W, Toronto, ON");
  const [checkoutDogName, setCheckoutDogName] = useState("Milo");

  // Gemini AI Brain Configuration State
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("fp_gemini_api_key") || "";
  });
  const [hasActiveGeminiKey, setHasActiveGeminiKey] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("fp_gemini_api_key");
  });
  const [keyTestStatus, setKeyTestStatus] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState(false);

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      localStorage.removeItem("fp_gemini_api_key");
      setHasActiveGeminiKey(false);
      setKeyTestStatus("Cleared key. Operating with built-in neural concierge.");
      return;
    }
    localStorage.setItem("fp_gemini_api_key", trimmed);
    setHasActiveGeminiKey(true);
    setKeyTestStatus("Saved! Qimmiq will now route queries to live Google Gemini 2.0 Flash.");
    setTimeout(() => setKeyTestStatus(null), 4000);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("fp_gemini_api_key");
    setApiKeyInput("");
    setHasActiveGeminiKey(false);
    setKeyTestStatus("API Key removed. Switched back to built-in concierge.");
    setTimeout(() => setKeyTestStatus(null), 3000);
  };

  const handleTestApiKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setKeyTestStatus("Please paste a Gemini API Key first.");
      return;
    }
    setTestingKey(true);
    setKeyTestStatus("Testing connection to Google Gemini 2.0 Flash...");
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Say 'OK' in 1 word." }] }],
          }),
        }
      );
      if (res.ok) {
        setKeyTestStatus("✅ Connected successfully to Google Gemini 2.0 Flash!");
        localStorage.setItem("fp_gemini_api_key", key);
        setHasActiveGeminiKey(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setKeyTestStatus(`⚠️ Key Error: ${errData.error?.message || "Invalid API Key"}`);
      }
    } catch (e: any) {
      setKeyTestStatus(`Connection error: ${e.message}`);
    } finally {
      setTestingKey(false);
    }
  };

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "ai",
      text: isAdmin
        ? "👨‍💼 Operations Director Mode active. I can report on today's revenue ($860 CAD), Van #1 freshwater (72%), active Latchkey codes, and route density. ⚡"
        : "Woof! 🐾 I'm Qimmiq, your Toronto Mobile Dog Spa Concierge. How may I pamper your pooch today? (I speak English & Español!)",
    },
  ]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    setMode(isAdmin ? "admin" : "client");
    setMsgs([
      {
        from: "ai",
        text: isAdmin
          ? "👨‍💼 Operations Director Mode active. I can report on today's revenue ($860 CAD), Van #1 freshwater (72%), active Latchkey codes, and route density. ⚡"
          : "Woof! 🐾 I'm Qimmiq, your Toronto Mobile Dog Spa Concierge. How may I pamper your pooch today? (I speak English & Español!)",
      },
    ]);
  }, [isAdmin]);

  // Handle adding items to cart
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setCartToast(`Added "${item.name}" to cart! 🐾`);
    setTimeout(() => setCartToast(null), 3500);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const rawSubtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const discount15 = rawSubtotal * 0.15;
  const finalTotal = Math.max(0, rawSubtotal - discount15);

  const handleCompleteOrder = () => {
    recordRealCompletedGroom();
    setCheckoutStep("success");
    setTimeout(() => {
      setCart([]);
    }, 1000);
  };

  // Welcome toast
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("fp_qimmiq_welcome_dismissed");
    const shownInSession = sessionStorage.getItem("fp_qimmiq_welcome_shown");

    if (dismissed === "true" || shownInSession === "true") return;

    const timer = setTimeout(() => {
      setWelcomeToast(true);
      sessionStorage.setItem("fp_qimmiq_welcome_shown", "true");
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismissToast = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWelcomeToast(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("fp_qimmiq_welcome_dismissed", "true");
    }
  };

  const handleOpenAssistant = () => {
    setOpen(true);
    setWelcomeToast(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("fp_qimmiq_welcome_dismissed", "true");
    }
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "user", text: t }]);
    setInput("");
    setTyping(true);

    const activeMode: Mode = isAdmin ? mode : "client";
    const detectedLang = detectLanguage(t, convLang);
    setConvLang(detectedLang);
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);

    const extracted = extractEntities(t);
    lastEntitiesRef.current = {
      breed: extracted.breed || lastEntitiesRef.current.breed,
      breedTier: extracted.breedTier || lastEntitiesRef.current.breedTier,
      location: extracted.location || lastEntitiesRef.current.location,
      isBathOnly: extracted.isBathOnly !== undefined ? extracted.isBathOnly : lastEntitiesRef.current.isBathOnly,
      isFullGroom: extracted.isFullGroom !== undefined ? extracted.isFullGroom : lastEntitiesRef.current.isFullGroom,
    };

    // 1. Try Live Google Gemini 2.0 Flash if API key is provided
    const activeApiKey = typeof window !== "undefined" ? localStorage.getItem("fp_gemini_api_key") || "" : "";
    if (activeApiKey) {
      try {
        const geminiResult = await callGeminiLive(t, msgs, lastEntitiesRef.current, detectedLang, activeApiKey);
        if (geminiResult && geminiResult.text) {
          setMsgs((m) => [...m, { from: "ai", text: geminiResult.text, actionItems: geminiResult.actionItems }]);
          setTyping(false);
          return;
        }
      } catch (err) {
        console.warn("Live Gemini request failed, using local brain:", err);
      }
    }

    // 2. High-intelligence local conversational engine with full intent recognition & action items
    const generated = generateAgentReply(t, activeMode, detectedLang, newTurn, lastEntitiesRef.current);
    setMsgs((m) => [...m, { from: "ai", text: generated.text, actionItems: generated.actionItems }]);
    setTyping(false);
  };

  const currentMode: Mode = isAdmin ? mode : "client";
  const prompts = currentMode === "admin" ? ADMIN_PROMPTS : CLIENT_PROMPTS;

  return (
    <>
      {/* Welcome Speech Bubble with Smart Dismissal */}
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
                <span className="font-serif text-xs font-bold text-teal flex items-center gap-1.5">
                  {isAdmin ? "Qimmiq Ops Copilot" : "Qimmiq AI Concierge"}
                </span>
                <button
                  onClick={handleDismissToast}
                  className="text-muted-foreground hover:text-foreground text-xs p-0.5 rounded transition-colors"
                  aria-label="Close message"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p
                className="mt-1 text-xs text-foreground leading-relaxed cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleOpenAssistant}
              >
                {isAdmin ? (
                  <>⚡ <strong>Ops Copilot:</strong> Review today's revenue ($860 CAD), Van #1 freshwater (72%), and route stops. 🚐</>
                ) : (
                  <>👋 <strong>Hi there!</strong> I'm <strong>Qimmiq</strong>. Ask me about pricing for your dog's breed, Sunday appointments, or booking in Toronto. 🐾</>
                )}
              </p>
              <button
                onClick={handleOpenAssistant}
                className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-bold text-teal hover:underline"
              >
                {isAdmin ? "Open Fleet Copilot →" : "Chat with Qimmiq →"}
              </button>
            </div>
          </div>
          <div className="absolute -bottom-2 right-8 h-3.5 w-3.5 rotate-45 border-b border-r border-gold/40 bg-card" />
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={handleOpenAssistant}
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
            {isAdmin ? "Ops Copilot AI" : "Mobile Dog Spa Concierge"}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{isAdmin ? "Open Copilot" : "Ask Qimmiq"}</span>
            {cart.length > 0 && (
              <span className="flex items-center gap-1 bg-gold text-ink text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                <ShoppingCart className="h-3 w-3" /> {cart.length}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Chat Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-lift transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {/* Drawer Header */}
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
                <p className="text-xs text-primary-foreground/80">Fresh Pooch Concierge</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAiConfig(!showAiConfig)}
                title="AI Engine Settings (Google Gemini 2.0 Flash / Built-in Brain)"
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition shadow-sm",
                  hasActiveGeminiKey
                    ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40"
                    : "bg-primary-foreground/15 text-primary-foreground/90 hover:bg-primary-foreground/25"
                )}
              >
                <Cpu className="h-3 w-3" />
                <span>{hasActiveGeminiKey ? "Gemini Live" : "AI Brain"}</span>
              </button>
              {cart.length > 0 && (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink shadow-sm hover:scale-105 transition"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Cart ({cart.length})</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 hover:bg-primary-foreground/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {isAdmin ? (
            <div className="mt-4 inline-flex rounded-full bg-primary-foreground/15 p-1 text-xs font-semibold">
              {(["admin", "client"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn("rounded-full px-3.5 py-1.5 transition-colors", mode === m ? "bg-gold text-ink" : "opacity-80")}
                >
                  {m === "admin" ? "⚡ Admin Copilot" : "🐾 Client Preview"}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium text-primary-foreground/90">
              <span>🐾 1-on-1 Toronto Mobile Dog Spa Concierge</span>
            </div>
          )}
        </div>

        {/* AI Brain Configuration Drawer Panel */}
        {showAiConfig && (
          <div className="border-b border-gold/40 bg-card p-4 text-xs shadow-md animate-fade-down z-20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-foreground flex items-center gap-1.5 font-serif text-sm">
                <Cpu className="h-4 w-4 text-gold" />
                Qimmiq AI Brain Engine
              </span>
              <button
                onClick={() => setShowAiConfig(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Qimmiq cuenta con nuestro motor conversacional de spa móvil en Toronto. Puedes conectar <strong>Google Gemini 2.0 Flash</strong> en vivo para razonamiento autónomo profundo y lenguaje ultra-natural.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Google Gemini API Key (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Pega tu clave AIzaSy... de Google AI Studio"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-gold shadow-sm font-mono"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="rounded-xl bg-gold px-3.5 py-1.5 text-xs font-bold text-ink hover:scale-105 transition shadow-sm"
                >
                  Guardar
                </button>
                {hasActiveGeminiKey && (
                  <button
                    onClick={handleClearApiKey}
                    className="rounded-xl border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive transition"
                    title="Borrar clave"
                  >
                    Borrar
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleTestApiKey}
                  disabled={testingKey}
                  className="text-[10px] text-teal font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={cn("h-3 w-3", testingKey && "animate-spin")} />
                  {testingKey ? "Probando conexión..." : "Probar Conexión Gemini"}
                </button>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 underline"
                >
                  Obtener Clave Gratis en Google AI Studio <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              {keyTestStatus && (
                <div className="mt-2 rounded-xl bg-muted/60 border border-border p-2 text-[11px] font-medium text-foreground">
                  {keyTestStatus}
                </div>
              )}

              <div className="pt-1 flex items-center justify-between border-t border-border/50 text-[10px]">
                <span className="text-muted-foreground">Estado Actual:</span>
                <span className={cn(
                  "font-bold px-2 py-0.5 rounded-full",
                  hasActiveGeminiKey
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                )}>
                  {hasActiveGeminiKey ? "🟢 Live Google Gemini 2.0 Flash Activo" : "🔵 Concierge Neuronal Local Activo"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="relative flex-1 space-y-3 overflow-y-auto p-5">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
            <img src={qimmiqAvatar} alt="" className="h-64 w-64 object-contain" />
          </div>

          {/* Cart Toast Notification inside Chat */}
          {cartToast && (
            <div className="sticky top-2 z-20 flex items-center justify-between rounded-xl border border-gold/40 bg-ink px-3.5 py-2 text-xs font-semibold text-white shadow-lift animate-fade-down">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                {cartToast}
              </span>
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="text-[11px] font-bold text-gold underline hover:opacity-90 ml-2"
              >
                View Cart ➔
              </button>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-2", m.from === "user" ? "items-end" : "items-start")}>
              <div className={cn("flex items-end gap-2", m.from === "user" ? "justify-end" : "justify-start")}>
                {m.from === "ai" && (
                  <img
                    src={qimmiqAvatar}
                    alt="Qimmiq"
                    className="h-7 w-7 rounded-full border border-gold shrink-0 object-cover"
                  />
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                    m.from === "user" ? "bg-ink text-ink-foreground rounded-br-none" : "bg-card border border-border rounded-bl-none shadow-sm",
                  )}
                >
                  {m.from === "ai" ? renderInlineMarkdown(m.text) : m.text}
                </div>
              </div>

              {/* Actionable Service / Cart Cards inside Chat */}
              {m.actionItems && m.actionItems.length > 0 && (
                <div className="ml-9 mt-1 w-full max-w-[85%] space-y-2.5 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                    <span>🛍️</span> Recommended Services for Your Pooch:
                  </div>
                  {m.actionItems.map((item) => {
                    const isInCart = cart.some((c) => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-2xl border p-3.5 shadow-sm transition-all duration-200",
                          isInCart
                            ? "border-emerald-500/60 bg-emerald-500/5 shadow-md"
                            : "border-gold/30 bg-card hover:border-gold/70"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="text-2xl mt-0.5">{item.icon || "🐾"}</span>
                            <div>
                              <div className="text-xs font-bold text-foreground flex flex-wrap items-center gap-1.5">
                                <span>{item.name}</span>
                                {item.badge && (
                                  <span className="text-[9px] bg-gold/20 text-ink font-extrabold px-1.5 py-0.5 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.highlights && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                  {item.highlights}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-serif text-sm font-extrabold text-teal">
                              ${item.price} <span className="text-[10px] font-sans text-muted-foreground">CAD</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                          <span className="text-[10px] text-emerald-600 font-medium">
                            15% OFF with TORONTOFRESH15
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition shadow-sm",
                              isInCart
                                ? "bg-emerald-600 text-white"
                                : "bg-gradient-gold text-ink hover:scale-105 active:scale-95"
                            )}
                          >
                            {isInCart ? (
                              <>
                                <Check className="h-3 w-3" /> Added ✓
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-3 w-3" /> + Add to Cart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-2">
              <img
                src={qimmiqAvatar}
                alt="Qimmiq"
                className="h-7 w-7 rounded-full border border-gold shrink-0 object-cover"
              />
              <div className="rounded-2xl rounded-bl-none border border-border bg-card px-4 py-2 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={end} />
        </div>

        {/* Drawer Footer & Cart Bar */}
        <div className="border-t border-border bg-card p-4">
          {/* Active Cart Summary Bar */}
          {cart.length > 0 && (
            <div className="mb-3 rounded-2xl bg-ink p-3 text-ink-foreground shadow-lift border border-gold/40 flex items-center justify-between animate-fade-up">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-ink font-extrabold text-xs">
                    {cart.length}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>Cart Total:</span>
                    <span className="font-serif text-sm font-bold text-gold">
                      ${finalTotal.toFixed(2)} CAD
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-medium">
                    15% welcome code TORONTOFRESH15 applied
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCheckoutModal(true)}
                className="rounded-full bg-gradient-gold px-3.5 py-1.5 text-xs font-extrabold text-ink shadow-sm hover:scale-105 transition flex items-center gap-1"
              >
                Checkout & Pay <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Quick prompts chips */}
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-sage hover:bg-sage-soft transition-colors whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message input */}
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
              placeholder={
                isAdmin && currentMode === "admin"
                  ? "Ask about revenue, freshwater levels, gate codes..."
                  : "Ask Qimmiq a question or book your mobile spa..."
              }
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

      {/* Express Checkout & Payment Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-gold/40 bg-card p-6 text-foreground shadow-lift overflow-hidden">
            <button
              onClick={() => {
                setShowCheckoutModal(false);
                setCheckoutStep("review");
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            {checkoutStep === "review" ? (
              <div className="space-y-4">
                <div className="border-b border-border pb-3">
                  <div className="eyebrow text-gold">The Fresh Pooch · Express Checkout</div>
                  <h3 className="font-serif text-2xl font-bold">Review & Book Mobile Spa</h3>
                  <p className="text-xs text-muted-foreground">
                    100% cage-free mobile grooming at your Toronto doorstep.
                  </p>
                </div>

                {/* Items in cart */}
                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      Your cart is currently empty. Ask Qimmiq to recommend a service!
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.icon || "🐾"}</span>
                          <div>
                            <span className="font-bold">{item.name}</span>
                            {item.breed && (
                              <span className="block text-[10px] text-muted-foreground">
                                For {item.breed}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif font-bold text-teal">${item.price} CAD</span>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pricing Summary */}
                {cart.length > 0 && (
                  <div className="rounded-2xl border border-gold/30 bg-gold/5 p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${rawSubtotal.toFixed(2)} CAD</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-600">
                      <span>Welcome Privilege (TORONTOFRESH15 - 15% OFF)</span>
                      <span>-${discount15.toFixed(2)} CAD</span>
                    </div>
                    <div className="flex justify-between border-t border-gold/20 pt-1.5 font-bold text-sm text-foreground">
                      <span>Total to Pay:</span>
                      <span className="font-serif text-lg text-teal">${finalTotal.toFixed(2)} CAD</span>
                    </div>
                  </div>
                )}

                {/* Booking Details Input */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">Dog's Name</label>
                      <input
                        value={checkoutDogName}
                        onChange={(e) => setCheckoutDogName(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-teal"
                        placeholder="e.g. Barnaby"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground block mb-1">Toronto Address</label>
                      <input
                        value={checkoutAddress}
                        onChange={(e) => setCheckoutAddress(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:border-teal"
                        placeholder="e.g. 142 Bloor St W"
                      />
                    </div>
                  </div>
                </div>

                {/* Canadian Payment Method Selector */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Select Payment Method (Canada)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("apple_pay")}
                      className={cn(
                        "rounded-xl border p-2 text-center text-xs font-bold transition",
                        paymentMethod === "apple_pay" ? "border-ink bg-ink text-white" : "border-border bg-card text-foreground"
                      )}
                    >
                      <span className="block text-sm"> Pay</span>
                      <span className="text-[9px] font-normal opacity-80">1-Tap</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("google_pay")}
                      className={cn(
                        "rounded-xl border p-2 text-center text-xs font-bold transition",
                        paymentMethod === "google_pay" ? "border-teal bg-teal text-white" : "border-border bg-card text-foreground"
                      )}
                    >
                      <span className="block text-sm">G Pay</span>
                      <span className="text-[9px] font-normal opacity-80">Instant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={cn(
                        "rounded-xl border p-2 text-center text-xs font-bold transition",
                        paymentMethod === "card" ? "border-gold bg-gold text-ink" : "border-border bg-card text-foreground"
                      )}
                    >
                      <span className="block text-sm">💳 Card</span>
                      <span className="text-[9px] font-normal opacity-80">Visa/MC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("interac")}
                      className={cn(
                        "rounded-xl border p-2 text-center text-xs font-bold transition",
                        paymentMethod === "interac" ? "border-[#ffd100] bg-[#ffd100] text-black" : "border-border bg-card text-foreground"
                      )}
                    >
                      <span className="block text-sm">Interac</span>
                      <span className="text-[9px] font-normal opacity-80">e-Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Pay Button */}
                <button
                  disabled={cart.length === 0}
                  onClick={handleCompleteOrder}
                  className="w-full mt-3 rounded-full bg-gradient-gold py-3 text-sm font-extrabold text-ink shadow-lift transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  Confirm Booking & Pay ${finalTotal.toFixed(2)} CAD ➔
                </button>
              </div>
            ) : (
              /* Success / Confirmation Screen */
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500">
                  <Check className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold">Booking Confirmed! 🐾</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Your luxury mobile spa trailer is reserved for <strong>{checkoutDogName}</strong> at <strong>{checkoutAddress}</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs space-y-1.5 text-left max-w-sm mx-auto">
                  <div className="flex justify-between font-mono text-[11px] text-teal">
                    <span>Digital Passport #FP-9942</span>
                    <span>PAID · ${finalTotal.toFixed(2)} CAD</span>
                  </div>
                  <div className="text-muted-foreground">
                    Method: {paymentMethod.toUpperCase()} · 100% Cage-Free Guaranteed
                  </div>
                  <div className="text-[11px] text-foreground font-semibold">
                    A digital arrival alert will be sent 15 minutes before the spa van reaches your doorstep.
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setCheckoutStep("review");
                  }}
                  className="rounded-full bg-ink px-6 py-2.5 text-xs font-bold text-ink-foreground hover:bg-ink/90 transition"
                >
                  Done & Back to Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
