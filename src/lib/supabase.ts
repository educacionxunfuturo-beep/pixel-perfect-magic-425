import { createClient } from "@supabase/supabase-js";

// Optional environment variables for production Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface PetProfile {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  weight_lbs: number;
  coat_type: string;
  special_notes?: string;
  created_at?: string;
}

export interface VaccineRecord {
  id: string;
  dog_id: string;
  vaccine_name: "Rabies" | "Bordetella" | "DHPP";
  administered_date: string;
  expiry_date: string;
  status: "verified" | "expiring_soon" | "expired";
  certificate_url?: string;
}

export interface AppointmentRecord {
  id: string;
  owner_id: string;
  dog_id: string;
  package_id: string;
  service_date: string;
  time_window: string;
  postal_code: string;
  address: string;
  latchkey_code?: string;
  total_cad: number;
  payment_method: "card" | "apple_pay" | "google_pay" | "interac";
  payment_status: "hold_authorized" | "paid" | "pending";
  status: "confirmed" | "en_route" | "in_spa" | "completed" | "cancelled";
  created_at?: string;
}

export interface ReportCardRecord {
  id: string;
  appointment_id: string;
  dog_id: string;
  behavior_rating: number; // 1-5
  coat_condition: string;
  notes: string;
  photo_after_url: string;
  groomer_name: string;
  created_at?: string;
}

// Client-side local fallback storage when Supabase keys are not yet configured
const LOCAL_STORAGE_KEY = "fresh_pooch_local_db";

interface LocalDatabase {
  pets: PetProfile[];
  vaccines: VaccineRecord[];
  appointments: AppointmentRecord[];
  reportCards: ReportCardRecord[];
}

function getLocalDB(): LocalDatabase {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    pets: [
      {
        id: "dog_barnaby_01",
        owner_id: "owner_demo_01",
        name: "Barnaby",
        breed: "Goldendoodle (F1b)",
        weight_lbs: 32,
        coat_type: "Wavy / Low Shed",
        special_notes: "Gentle with rear paws, loves blueberry facial",
      },
    ],
    vaccines: [
      {
        id: "vac_01",
        dog_id: "dog_barnaby_01",
        vaccine_name: "Rabies",
        administered_date: "2025-04-10",
        expiry_date: "2027-04-10",
        status: "verified",
      },
      {
        id: "vac_02",
        dog_id: "dog_barnaby_01",
        vaccine_name: "Bordetella",
        administered_date: "2025-10-24",
        expiry_date: "2026-10-24",
        status: "expiring_soon",
      },
      {
        id: "vac_03",
        dog_id: "dog_barnaby_01",
        vaccine_name: "DHPP",
        administered_date: "2025-06-12",
        expiry_date: "2027-06-12",
        status: "verified",
      },
    ],
    appointments: [],
    reportCards: [],
  };
}

function saveLocalDB(db: LocalDatabase) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore
  }
}

// Unified Data Access Layer (uses Supabase when available, fallback to LocalStorage)
export const dbService = {
  async getPetProfile(ownerId: string): Promise<PetProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from("dogs").select("*").eq("owner_id", ownerId).single();
      if (data) return data;
    }
    const db = getLocalDB();
    return db.pets[0] || null;
  },

  async updatePetProfile(pet: Partial<PetProfile>): Promise<PetProfile> {
    if (isSupabaseConfigured && supabase && pet.id) {
      const { data } = await supabase.from("dogs").update(pet).eq("id", pet.id).select().single();
      if (data) return data;
    }
    const db = getLocalDB();
    const existing = db.pets[0] || { id: "dog_barnaby_01", owner_id: "owner_demo_01" };
    const updated = { ...existing, ...pet } as PetProfile;
    db.pets[0] = updated;
    saveLocalDB(db);
    return updated;
  },

  async getVaccines(dogId: string): Promise<VaccineRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from("vaccines").select("*").eq("dog_id", dogId);
      if (data) return data;
    }
    const db = getLocalDB();
    return db.vaccines;
  },

  async saveAppointment(appt: Omit<AppointmentRecord, "id">): Promise<AppointmentRecord> {
    const newRecord: AppointmentRecord = {
      ...appt,
      id: "appt_" + Date.now().toString(36),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from("appointments").insert([newRecord]).select().single();
      if (data) return data;
    }

    const db = getLocalDB();
    db.appointments.unshift(newRecord);
    saveLocalDB(db);
    return newRecord;
  },
};
