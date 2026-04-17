-- ============================================================
-- BabyCare App — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- BABIES
-- ─────────────────────────────────────────
create table if not exists babies (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  name            text not null,
  date_of_birth   date,
  due_date        date,
  gender          text check (gender in ('boy', 'girl', 'unknown')) default 'unknown',
  status          text check (status in ('born', 'expecting')) not null,
  parent1_name    text not null,
  parent2_name    text,
  photo_url       text,
  created_at      timestamptz default now()
);

alter table babies enable row level security;

create policy "Users manage their own babies"
  on babies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- FEEDINGS
-- ─────────────────────────────────────────
create table if not exists feedings (
  id            uuid primary key default uuid_generate_v4(),
  baby_id       uuid references babies(id) on delete cascade,
  type          text check (type in ('breast', 'bottle', 'solid')) not null,
  amount_ml     integer,
  duration_mins integer,
  side          text check (side in ('left', 'right', 'both')),
  food_note     text,
  logged_at     timestamptz not null default now()
);

alter table feedings enable row level security;

create policy "Users manage feedings for their babies"
  on feedings for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

create index feedings_baby_logged_idx on feedings(baby_id, logged_at desc);

-- ─────────────────────────────────────────
-- SLEEPS
-- ─────────────────────────────────────────
create table if not exists sleeps (
  id          uuid primary key default uuid_generate_v4(),
  baby_id     uuid references babies(id) on delete cascade,
  type        text check (type in ('nap', 'night')) not null default 'nap',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

alter table sleeps enable row level security;

create policy "Users manage sleeps for their babies"
  on sleeps for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

create index sleeps_baby_started_idx on sleeps(baby_id, started_at desc);

-- ─────────────────────────────────────────
-- DIAPERS
-- ─────────────────────────────────────────
create table if not exists diapers (
  id         uuid primary key default uuid_generate_v4(),
  baby_id    uuid references babies(id) on delete cascade,
  type       text check (type in ('wet', 'dirty', 'both')) not null,
  notes      text,
  logged_at  timestamptz not null default now()
);

alter table diapers enable row level security;

create policy "Users manage diapers for their babies"
  on diapers for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

create index diapers_baby_logged_idx on diapers(baby_id, logged_at desc);

-- ─────────────────────────────────────────
-- GROWTH RECORDS
-- ─────────────────────────────────────────
create table if not exists growth_records (
  id           uuid primary key default uuid_generate_v4(),
  baby_id      uuid references babies(id) on delete cascade,
  weight_kg    numeric(5, 2),
  height_cm    numeric(5, 1),
  head_cm      numeric(5, 1),
  measured_at  date not null default current_date,
  notes        text
);

alter table growth_records enable row level security;

create policy "Users manage growth records for their babies"
  on growth_records for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

-- ─────────────────────────────────────────
-- MILESTONES
-- ─────────────────────────────────────────
create table if not exists milestones (
  id           uuid primary key default uuid_generate_v4(),
  baby_id      uuid references babies(id) on delete cascade,
  title        text not null,
  category     text check (category in ('motor', 'social', 'language', 'cognitive')),
  achieved_at  timestamptz default now(),
  notes        text
);

alter table milestones enable row level security;

create policy "Users manage milestones for their babies"
  on milestones for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

-- Unique constraint so we can toggle milestones
create unique index milestones_baby_title_idx on milestones(baby_id, title);

-- ─────────────────────────────────────────
-- VACCINE RECORDS
-- ─────────────────────────────────────────
create table if not exists vaccine_records (
  id                  uuid primary key default uuid_generate_v4(),
  baby_id             uuid references babies(id) on delete cascade,
  vaccine_name        text not null,
  scheduled_age_days  integer,
  scheduled_date      date,
  given_date          date,
  clinic_note         text,
  status              text check (status in ('pending', 'done', 'snoozed')) default 'pending'
);

alter table vaccine_records enable row level security;

create policy "Users manage vaccine records for their babies"
  on vaccine_records for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

create unique index vaccine_records_baby_name_idx on vaccine_records(baby_id, vaccine_name);

-- ─────────────────────────────────────────
-- MEDICINE LOGS
-- ─────────────────────────────────────────
create table if not exists medicine_logs (
  id          uuid primary key default uuid_generate_v4(),
  baby_id     uuid references babies(id) on delete cascade,
  name        text not null,
  dose        text,
  frequency   text,
  start_date  date,
  end_date    date,
  notes       text
);

alter table medicine_logs enable row level security;

create policy "Users manage medicine logs for their babies"
  on medicine_logs for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

-- ─────────────────────────────────────────
-- SHARE TOKENS (Grandparent sharing)
-- ─────────────────────────────────────────
create table if not exists share_tokens (
  id               uuid primary key default uuid_generate_v4(),
  baby_id          uuid references babies(id) on delete cascade,
  token            uuid unique not null default uuid_generate_v4(),
  label            text,
  show_feeding     boolean default true,
  show_sleep       boolean default true,
  show_diapers     boolean default true,
  show_milestones  boolean default true,
  show_growth      boolean default true,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

alter table share_tokens enable row level security;

create policy "Users manage share tokens for their babies"
  on share_tokens for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

-- Public read for share page (no login required)
create policy "Public can read active share tokens"
  on share_tokens for select
  using (is_active = true);

-- ─────────────────────────────────────────
-- AI CACHE — TIPS
-- ─────────────────────────────────────────
create table if not exists tip_cache (
  baby_id     uuid references babies(id) on delete cascade,
  age_week    integer not null,
  tips        jsonb not null,
  created_at  timestamptz default now(),
  primary key (baby_id, age_week)
);

alter table tip_cache enable row level security;

create policy "Users manage tip cache for their babies"
  on tip_cache for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));

-- ─────────────────────────────────────────
-- AI CACHE — PRODUCTS
-- ─────────────────────────────────────────
create table if not exists product_cache (
  baby_id     uuid references babies(id) on delete cascade,
  age_month   integer not null,
  category    text not null,
  products    jsonb not null,
  created_at  timestamptz default now(),
  primary key (baby_id, age_month, category)
);

alter table product_cache enable row level security;

create policy "Users manage product cache for their babies"
  on product_cache for all
  using (baby_id in (select id from babies where user_id = auth.uid()))
  with check (baby_id in (select id from babies where user_id = auth.uid()));
