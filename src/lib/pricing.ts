/**
 * Single price list for the whole app: the public quote wizard, the portal
 * booking form, the groomer route and Qimmiq all quote from here, so a
 * customer never sees two different prices for the same groom.
 * The package ranges below are the published ones; quotes always fall inside them.
 * Keep backend/src/modules/pricing/pricing.service.ts in step with these numbers.
 */

export type ServiceId = "tidy" | "full" | "ultimate";
export type WeightTierId = "s" | "m" | "l" | "g";
export type CoatId = "normal" | "light" | "severe";
export type AddonId = "salt" | "facial" | "shed";

export const SERVICES: Record<ServiceId, { name: string; floor: number; adjust: number; published: string }> = {
  tidy: { name: "Bath & Tidy", floor: 130, adjust: -10, published: "From $130" },
  full: { name: "Premium Full Groom", floor: 140, adjust: 0, published: "From $140" },
  ultimate: { name: "The Ultimate Spa Experience", floor: 290, adjust: 100, published: "From $290" },
};

export const SERVICE_IDS: ServiceId[] = ["tidy", "full", "ultimate"];

export const WEIGHT_TIERS: { id: WeightTierId; label: string; sub: string; maxLbs: number; base: number }[] = [
  { id: "s", label: "Small", sub: "< 20 lbs", maxLbs: 20, base: 140 },
  { id: "m", label: "Medium", sub: "21–45 lbs", maxLbs: 45, base: 155 },
  { id: "l", label: "Large", sub: "46–75 lbs", maxLbs: 75, base: 172 },
  { id: "g", label: "Giant", sub: "76+ lbs", maxLbs: Infinity, base: 190 },
];

/** Breeds offered in the quote wizard, with their coat-work factor. */
export const QUOTE_BREEDS: { name: string; factor: number }[] = [
  { name: "Goldendoodle", factor: 1.15 },
  { name: "Maltese", factor: 0.95 },
  { name: "French Bulldog", factor: 0.85 },
  { name: "Golden Retriever", factor: 1.1 },
  { name: "Shih Tzu", factor: 0.95 },
  { name: "Bernedoodle", factor: 1.2 },
  { name: "Labrador Retriever", factor: 1.0 },
  { name: "Cavalier King Charles", factor: 0.95 },
  { name: "Standard Poodle", factor: 1.2 },
  { name: "Siberian Husky", factor: 1.1 },
];

/** Extra breeds Qimmiq recognises in chat: they reuse the factor of the wizard breed with the same coat. */
const OTHER_BREEDS: Record<string, number> = {
  "Giant Bernedoodle": 1.2, // Bernedoodle
  Labradoodle: 1.15, // Goldendoodle
  Cockapoo: 1.15, // Goldendoodle
  Poodle: 1.2, // Standard Poodle
  Pomeranian: 0.95, // Maltese
  "Yorkshire Terrier": 0.95, // Maltese
};

export const COATS: { id: CoatId; label: string; add: number }[] = [
  { id: "normal", label: "Normal Coat", add: 0 },
  { id: "light", label: "Light Matted", add: 20 },
  { id: "severe", label: "Severe Matted", add: 45 },
];

export const ADDONS: { id: AddonId; label: string; price: number }[] = [
  { id: "salt", label: "Winter Road Salt Paw Protection", price: 25 },
  { id: "facial", label: "Deep Blueberry Facial", price: 15 },
  { id: "shed", label: "De-Shedding Treatment", price: 35 },
];

export const SIBLING_DISCOUNT = 20;
export const WELCOME_CODE = "TORONTOFRESH15";
export const WELCOME_DISCOUNT = 0.15;

const FACTORS = [...QUOTE_BREEDS.map((b) => b.factor), ...Object.values(OTHER_BREEDS)];
const MIN_FACTOR = Math.min(...FACTORS);
const MAX_FACTOR = Math.max(...FACTORS);

export function breedFactor(breed?: string): number {
  if (!breed) return 1;
  return QUOTE_BREEDS.find((b) => b.name === breed)?.factor ?? OTHER_BREEDS[breed] ?? 1;
}

export function tierForWeight(lbs: number): WeightTierId {
  return (WEIGHT_TIERS.find((t) => lbs <= t.maxLbs) ?? WEIGHT_TIERS[WEIGHT_TIERS.length - 1]!).id;
}

function tierBase(tier: WeightTierId): number {
  return WEIGHT_TIERS.find((t) => t.id === tier)!.base;
}

function basePrice(service: ServiceId, tier: WeightTierId, factor: number): number {
  const s = SERVICES[service];
  return Math.max(s.floor, Math.round((tierBase(tier) * factor) / 5) * 5 + s.adjust);
}

export interface QuoteInput {
  service: ServiceId;
  tier: WeightTierId;
  breed?: string;
  coat?: CoatId;
  addons?: AddonId[];
  sibling?: boolean;
}

export interface Quote {
  base: number;
  coatAdd: number;
  addonTotal: number;
  discount: number;
  total: number;
}

export function quote({ service, tier, breed, coat = "normal", addons = [], sibling = false }: QuoteInput): Quote {
  const base = basePrice(service, tier, breedFactor(breed));
  const coatAdd = COATS.find((c) => c.id === coat)!.add;
  const addonTotal = ADDONS.filter((a) => addons.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const discount = sibling ? SIBLING_DISCOUNT : 0;
  return { base, coatAdd, addonTotal, discount, total: base + coatAdd + addonTotal - discount };
}

/** Base price range for a service, for one weight tier or across all of them (any breed). */
export function priceRange(service: ServiceId, tier?: WeightTierId): [number, number] {
  const tiers = tier ? [tier] : WEIGHT_TIERS.map((t) => t.id);
  const lows = tiers.map((t) => basePrice(service, t, MIN_FACTOR));
  const highs = tiers.map((t) => basePrice(service, t, MAX_FACTOR));
  return [Math.min(...lows), Math.max(...highs)];
}

export function formatRange([low, high]: [number, number]): string {
  return low === high ? `$${low}` : `$${low}–$${high}`;
}

export function withWelcomeDiscount(price: number): string {
  return (price * (1 - WELCOME_DISCOUNT)).toFixed(2);
}
