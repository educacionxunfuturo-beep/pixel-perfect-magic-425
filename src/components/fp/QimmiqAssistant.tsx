import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Send, ShoppingCart, Check, CreditCard, Trash2, ArrowRight, Cpu, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import qimmiqAvatar from "@/assets/qimmiq-avatar.jpg";
import { createAppointment, torontoToday, addDays, useAppointments, type Appointment } from "@/lib/appointments";
import { buildOpsSnapshot } from "@/lib/copilot-snapshot";
import { ADDONS, SERVICE_IDS, SERVICES, priceRange, quote, type ServiceId } from "@/lib/pricing";
import {
  bathOnlyReply, bestServiceReply, bookingReply, copilotReply, differenceReply, discountReply, menuReply, priceTableReply, quoteReply, serviceRequestReply,
} from "@/lib/qimmiq-replies";

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

const TIER_OF_ENTITY = { small: "s", medium: "m", large: "l", giant: "g" } as const;

/** Price an AI-suggested cart card from the shared price list (exact when breed and size are known). */
function officialCardPrice(item: CartItem, entities: ExtractedEntities): CartItem {
  if (item.category === "addon") {
    const addon = ADDONS.find((a) => item.name.toLowerCase().includes(a.label.toLowerCase().split(" ").slice(-2).join(" ")));
    return addon ? { ...item, price: addon.price } : item;
  }
  const name = item.name.toLowerCase();
  const service: ServiceId | undefined = /ultimate/.test(name) ? "ultimate" : /bath|tidy/.test(name) ? "tidy" : /groom|cut|full/.test(name) ? "full" : undefined;
  if (!service) return item;
  const tier = entities.breedTier ? TIER_OF_ENTITY[entities.breedTier] : undefined;
  const price = tier && entities.breed ? quote({ service, tier, breed: entities.breed }).base : priceRange(service, tier)[0];
  return { ...item, price };
}

/** Current message wins; anything it doesn't mention is remembered from earlier turns. */
function mergeEntities(current: ExtractedEntities, previous?: ExtractedEntities): ExtractedEntities {
  const merged: ExtractedEntities = {};
  const breed = current.breed ?? previous?.breed;
  const breedTier = current.breedTier ?? previous?.breedTier;
  const location = current.location ?? previous?.location;
  const isBathOnly = current.isBathOnly ?? previous?.isBathOnly;
  const isFullGroom = current.isFullGroom ?? previous?.isFullGroom;
  if (breed !== undefined) merged.breed = breed;
  if (breedTier !== undefined) merged.breedTier = breedTier;
  if (location !== undefined) merged.location = location;
  if (isBathOnly !== undefined) merged.isBathOnly = isBathOnly;
  if (isFullGroom !== undefined) merged.isFullGroom = isFullGroom;
  return merged;
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
): Promise<AgentReplyResult | null> {
  try {
    // The server (src/lib/server-api.ts) holds the Gemini key and builds the prompt from the shared price list.
    const res = await fetch("/api/qimmiq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        history: history.slice(-6).map((m) => ({ from: m.from, text: m.text })),
        context: { breed: entities.breed, breedTier: entities.breedTier, location: entities.location },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    const candidate = data?.text;
    if (!candidate) return null;

    // The chat renders bold/italic/code; turn AI list markers and headings into plain bullets and bold lines.
    let rawText = candidate
      .replace(/^[ \t]*[*-][ \t]+/gm, "• ")
      .replace(/^#{1,6}[ \t]*(.+)$/gm, "**$1**");
    let actionItems: CartItem[] | undefined = undefined;

    // The cart JSON goes at the end of the answer. Hide it from the chat even when it arrives cut off.
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*(?:```|$)/i);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] ?? "{}");
        if (Array.isArray(parsed.actionItems)) {
          actionItems = parsed.actionItems;
        } else if (Array.isArray(parsed.recommended)) {
          actionItems = parsed.recommended;
        }
      } catch {
        // incomplete JSON: no cards for this answer
      }
      rawText = rawText.slice(0, jsonMatch.index).trim();
    }

    // Never trust prices written by the AI: package and add-on cards get the official price.
    if (actionItems) actionItems = actionItems.map((item) => officialCardPrice(item, entities));

    return { text: rawText, ...(actionItems ? { actionItems } : {}) };
  } catch (err) {
    console.warn("Gemini Live API error, falling back to local engine:", err);
    return null;
  }
}

/** Owner copilot through the server (staff session required); business data goes without codes, phones or addresses. */
async function callCopilotLive(query: string, history: Msg[], appointments: Appointment[]): Promise<string | null> {
  try {
    const res = await fetch("/api/qimmiq/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        // earlier answers listing Latchkey codes stay out of the AI request
        history: history.filter((m) => !/latchkey|lockbox/i.test(m.text)).slice(-6).map((m) => ({ from: m.from, text: m.text })),
        snapshot: buildOpsSnapshot(appointments),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    if (!data.text) return null;
    return data.text
      .replace(/```[\s\S]*?(?:```|$)/g, "")
      .replace(/^[ \t]*[*-][ \t]+/gm, "• ")
      .replace(/^#{1,6}[ \t]*(.+)$/gm, "**$1**")
      .trim() || null;
  } catch (err) {
    console.warn("Copilot AI error, falling back to local engine:", err);
    return null;
  }
}

function generateAgentReply(
  query: string,
  mode: Mode,
  activeLang: Lang = "en",
  turnCount: number = 0,
  lastEntities?: ExtractedEntities,
  appointments: Appointment[] = [],
): AgentReplyResult {
  const explicitSwitch = checkExplicitLanguageSwitch(query);
  const detectedLang = explicitSwitch || detectLanguage(query, activeLang);
  // The local engine writes its replies in English and Spanish only.
  const lang: Lang = detectedLang === "es" ? "es" : "en";
  const s = query.toLowerCase();
  const currentEntities = extractEntities(query);
  const entities: ExtractedEntities = mergeEntities(currentEntities, lastEntities);

  const profile = getUserProfile();
  const userName = profile.name;
  const petName = profile.petName;

  // 1. EXPLICIT LANGUAGE SWITCH / TRANSLATION REQUEST
  if (explicitSwitch) {
    if (explicitSwitch === "en") {
      if (entities.breed || entities.location) return quoteReply("en", entities);
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

  // 2. OWNER COPILOT: figures come from the appointment store
  if (mode === "admin") return copilotReply(s, lang, appointments);

  // 3. SPECIALIZED INQUIRY: BATH ONLY / "SOLO BAÑO" / "HAY SOLO DE ESE?"
  const isBathOnlyInquiry =
    /solo\s*ba[ñn]o|solamente\s*ba[ñn]o|servicio\s*de\s*ba[ñn]o|solo\s*ba[ñn]ar|solo\s*de\s*ese|existe\s*solo|hay\s*solo|solo\s*pregunto\s*si\s*(solo\s*)?existe|solo\s*ba[ñn]an|ba[ñn]o\s*solamente|solo\s*quiero\s*ba[ñn]ar|bath\s*only|only\s*a?\s*bath|just\s*a?\s*bath|only\s*bath|only\s*wash|just\s*wash|wash\s*only|bain\s*seulement|nur\s*baden/i.test(s) ||
    ((s.includes("bañ") || s.includes("bath") || s.includes("bain") || s.includes("baden")) && (s.includes("solo") || s.includes("only") || s.includes("just") || s.includes("existe") || s.includes("hay") || s.includes("pregunt")));

  if (isBathOnlyInquiry) return bathOnlyReply(lang, entities);

  // 4. DIRECT SERVICE REQUEST: "I WANT A SERVICE" / "QUIERO UN SERVICIO" / "QUIERO CONTRATAR"
  const isServiceRequest =
    /want a service|need a service|get a service|hire a service|looking for a service|booking a service|quiero un servicio|necesito un servicio|quisiera un servicio|quiero contratar|deseo un servicio|busco un servicio|quiero contratar el|quiero un corte|quiero atender|interesa un servicio|interesado en un servicio|ich möchte einen service|je veux un service/i.test(s);

  if (isServiceRequest) return serviceRequestReply(lang, entities);

  // 5. DIFFERENCE BETWEEN SERVICES: "DIFERENCIA ENTRE BAÑO Y CORTE"
  const isAskingDifference =
    /diferencia|difference|vs\b|cu[aá]l es mejor|which is better|distin|en qu[eé] se diferencia/i.test(s);

  if (isAskingDifference) return differenceReply(lang, entities);

  // 6. ALL SERVICES / FULL MENU
  const isAskingAllServices =
    /todos los servicios|qu[eé] servicios|qu[eé] ofrecen|all services|what services|full menu|catalog|servicios tienen|cu[aá]les son sus servicios/i.test(s);

  if (isAskingAllServices) return menuReply(lang, entities);

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
  if (isAskingDiscount) return discountReply(lang, entities);

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
  if (entities.breed && (isAskingPrice || currentEntities.isBathOnly || currentEntities.isFullGroom)) {
    return quoteReply(lang, entities);
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
      "• **King West / Downtown:** Mondays\n• **The Annex:** Tuesdays\n• **Midtown:** Wednesdays\n• **Rosedale:** Thursdays\n• **Christie Pits:** Fridays\n• **The Beaches:** Saturdays\n• **Leaside:** Sundays";
    const tableEs =
      "• **King West / Downtown:** lunes\n• **The Annex:** martes\n• **Midtown:** miércoles\n• **Rosedale:** jueves\n• **Christie Pits:** viernes\n• **The Beaches:** sábados\n• **Leaside:** domingos";

    if (day) {
      return {
        text: lang === "en"
          ? `🚐 Our mobile spa is in **${entities.location}** on **${day.en}**.\n\nHere is the full weekly route:\n${tableEn}\n\nWe also visit East York, Etobicoke, North York and more of the GTA. Share your postal code and I'll confirm your exact day! 🐾`
          : `🚐 Nuestro spa móvil pasa por **${entities.location}** **${day.es}**.\n\nEsta es la ruta completa de la semana:\n${tableEs}\n\nTambién vamos a East York, Etobicoke, North York y más zonas del GTA. Dime tu código postal y te confirmo tu día exacto. 🐾`,
      };
    }
    return {
      text: lang === "en"
        ? `📍 **We groom across Toronto and the GTA.** Our weekly route:\n${tableEn}\n\nWe also visit East York, Etobicoke, North York, Mississauga, Markham, Scarborough and Richmond Hill. Share your postal code and I'll confirm your day! 🐾`
        : `📍 **Atendemos en todo Toronto y el GTA.** Esta es la ruta de la semana:\n${tableEs}\n\nTambién vamos a East York, Etobicoke, North York, Mississauga, Markham, Scarborough y Richmond Hill. Dime tu código postal y te confirmo tu día. 🐾`,
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
  if (isAskingPrice) return priceTableReply(lang);

  // 20. BOOKING INTENT
  if (
    s.includes("agend") || s.includes("reserv") || s.includes("contrat") || s.includes("cita") ||
    s.includes("turno") || s.includes("book") || s.includes("schedul") || s.includes("appointment")
  ) {
    return bookingReply(lang, entities);
  }

  // 21. BEST SERVICE RECOMMENDATION
  if (
    s.includes("mejor") || s.includes("recomiend") || s.includes("best") || s.includes("recommend")
  ) {
    return bestServiceReply(lang, entities);
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
    text: (lang === "en" ? fallbackVariationsEn[idx] : fallbackVariationsEs[idx])!,
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

  // Live AI runs only when the server has a Gemini key (GEMINI_API_KEY); the browser never sees it.
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  useEffect(() => {
    fetch("/api/qimmiq/status")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((d: { configured?: boolean }) => setAiConfigured(Boolean(d.configured)))
      .catch(() => setAiConfigured(false));
  }, []);
  const { appointments } = useAppointments();

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "ai",
      text: isAdmin
        ? "👨‍💼 Operations Copilot ready. Ask me about today's route, revenue and bookings, Latchkey codes or vaccine records. ⚡"
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
          ? "👨‍💼 Operations Copilot ready. Ask me about today's route, revenue and bookings, Latchkey codes or vaccine records. ⚡"
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

  const handleCompleteOrder = async () => {
    const packages = cart.filter((i) => i.category === "package");
    const date = addDays(torontoToday(), 1);
    for (const item of packages) {
      const service: ServiceId = SERVICE_IDS.find((id) => item.name.startsWith(SERVICES[id].name)) ?? (/bath/i.test(item.name) ? "tidy" : /ultimate/i.test(item.name) ? "ultimate" : "full");
      await createAppointment({
        petName: checkoutDogName,
        breed: item.breed ?? "",
        weightLbs: 32,
        service,
        total: Math.round(item.price * 0.85),
        date,
        time: "8:30 AM",
        timeWindow: "To be confirmed",
        address: checkoutAddress,
        paymentMethod,
        status: "requested",
        source: "web",
      }).catch(() => undefined);
    }
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
    lastEntitiesRef.current = mergeEntities(extracted, lastEntitiesRef.current);

    // 1a. Owner copilot through the AI; Latchkey code questions stay on the built-in engine so codes never leave the app
    if (aiConfigured && activeMode === "admin" && !/latchkey|lockbox|c[oó]digo|\bcodes?\b|llave/i.test(t)) {
      const answer = await callCopilotLive(t, msgs, appointments);
      if (answer) {
        setMsgs((m) => [...m, { from: "ai", text: answer }]);
        setTyping(false);
        return;
      }
    }

    // 1b. Live AI for client questions through the server when it has a Gemini key
    if (aiConfigured && activeMode === "client") {
      try {
        const geminiResult = await callGeminiLive(t, msgs, lastEntitiesRef.current);
        if (geminiResult && geminiResult.text) {
          setMsgs((m) => [...m, { from: "ai", text: geminiResult.text, ...(geminiResult.actionItems ? { actionItems: geminiResult.actionItems } : {}) }]);
          setTyping(false);
          return;
        }
      } catch (err) {
        console.warn("Live AI request failed, using the built-in engine:", err);
      }
    }

    // 2. High-intelligence local conversational engine with full intent recognition & action items
    const generated = generateAgentReply(t, activeMode, detectedLang, newTurn, lastEntitiesRef.current, appointments);
    setMsgs((m) => [...m, { from: "ai", text: generated.text, ...(generated.actionItems ? { actionItems: generated.actionItems } : {}) }]);
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
                title="Which AI engine Qimmiq is using"
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition shadow-sm",
                  aiConfigured
                    ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40"
                    : "bg-primary-foreground/15 text-primary-foreground/90 hover:bg-primary-foreground/25"
                )}
              >
                <Cpu className="h-3 w-3" />
                <span>{aiConfigured ? "Live AI" : "AI Brain"}</span>
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

        {/* AI engine info (the key is configured on the server, never here) */}
        {showAiConfig && (
          <div className="border-b border-gold/40 bg-card p-4 text-xs shadow-md animate-fade-down z-20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-foreground flex items-center gap-1.5 font-serif text-sm">
                <Cpu className="h-4 w-4 text-gold" />
                Qimmiq AI Engine
              </span>
              <button onClick={() => setShowAiConfig(false)} className="text-muted-foreground hover:text-foreground text-xs p-1" aria-label="Close AI info">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {aiConfigured
                ? "Live AI is on: Google Gemini answers through our server, using the official price list for clients and the live booking data for the owner copilot. Latchkey codes, phone numbers and addresses are never sent to the AI."
                : "Qimmiq is using its built-in concierge engine. Live AI turns on when the business adds a Gemini key on the server."}
            </p>
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
                  Request Booking · ${finalTotal.toFixed(2)} CAD ➔
                </button>
              </div>
            ) : (
              /* Success / Confirmation Screen */
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500">
                  <Check className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold">Booking requested! 🐾</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    We received your request for <strong>{checkoutDogName}</strong> at <strong>{checkoutAddress}</strong>. Our team will confirm the exact route time.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs space-y-1.5 text-left max-w-sm mx-auto">
                  <div className="flex justify-between font-mono text-[11px] text-teal">
                    <span>Estimated total</span>
                    <span>${finalTotal.toFixed(2)} CAD · pay after the groom</span>
                  </div>
                  <div className="text-muted-foreground">
                    Method: {paymentMethod.toUpperCase()} · 100% Cage-Free Guaranteed
                  </div>
                  <div className="text-[11px] text-foreground font-semibold">
                    You will get the confirmed time before your visit. Nothing has been charged.
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
