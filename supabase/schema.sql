-- The Fresh Pooch Mobile Dog Spa (Toronto)
-- Production Supabase Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (Customers & Staff)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text default 'customer' check (role in ('customer', 'groomer', 'admin')),
  address text,
  postal_code text,
  default_latchkey_code text,
  created_at timestamp with time zone default now()
);

-- 2. Dogs (Pet Passports)
create table if not exists public.dogs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  breed text not null,
  weight_lbs numeric not null,
  coat_type text default 'normal',
  photo_url text,
  special_notes text,
  created_at timestamp with time zone default now()
);

-- 3. Vaccines Tracker (Ontario Standards Compliance)
create table if not exists public.vaccines (
  id uuid primary key default uuid_generate_v4(),
  dog_id uuid references public.dogs(id) on delete cascade,
  vaccine_name text not null check (vaccine_name in ('Rabies', 'Bordetella', 'DHPP')),
  administered_date date not null,
  expiry_date date not null,
  status text default 'verified' check (status in ('verified', 'expiring_soon', 'expired')),
  certificate_url text,
  created_at timestamp with time zone default now()
);

-- 4. Appointments & Live Routing
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete cascade,
  package_id text not null,
  service_date date not null,
  time_window text not null,
  postal_code text not null,
  address text not null,
  latchkey_code text,
  total_cad numeric not null,
  payment_method text not null check (payment_method in ('card', 'apple_pay', 'google_pay', 'interac')),
  payment_status text default 'hold_authorized' check (payment_status in ('hold_authorized', 'paid', 'pending', 'refunded')),
  status text default 'confirmed' check (status in ('confirmed', 'en_route', 'in_spa', 'completed', 'cancelled')),
  created_at timestamp with time zone default now()
);

-- 5. Digital Pooch Report Cards
create table if not exists public.report_cards (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete cascade,
  behavior_rating int check (behavior_rating between 1 and 5),
  coat_condition text,
  notes text,
  photo_after_url text,
  groomer_name text not null,
  sent_via_sms boolean default false,
  sent_via_email boolean default false,
  created_at timestamp with time zone default now()
);

-- 6. VIP Pooch Club Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete cascade,
  plan_tier text not null check (plan_tier in ('4-week', '6-week', '8-week')),
  price_per_visit_cad numeric not null,
  status text default 'active' check (status in ('active', 'paused', 'cancelled')),
  next_billing_date date,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.vaccines enable row level security;
alter table public.appointments enable row level security;
alter table public.report_cards enable row level security;
alter table public.subscriptions enable row level security;
