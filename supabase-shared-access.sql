-- ============================================================
-- BabyCare — Shared Baby Access Migration
-- Run this in Supabase SQL Editor AFTER running supabase-schema.sql
-- This enables Anjan + Sonakshi to share the same baby data
-- ============================================================

-- ─────────────────────────────────────────
-- 1. BABY ACCESS TABLE
--    Links allowed emails → baby_id + user_id
-- ─────────────────────────────────────────
create table if not exists baby_access (
  email    text primary key,
  baby_id  uuid references babies(id) on delete set null,
  user_id  uuid references auth.users(id) on delete set null unique
);

alter table baby_access enable row level security;

-- User can see their own row (by email or by user_id)
create policy "Users read their own access row"
  on baby_access for select
  using (email = auth.email() or user_id = auth.uid());

-- User can update their own row (e.g. to link user_id on first sign-in)
create policy "Users update their own access row"
  on baby_access for update
  using (email = auth.email())
  with check (email = auth.email());

-- Pre-seed the two allowed email addresses (no baby_id yet — set during onboarding)
insert into baby_access (email) values
  ('mahapatra.anjan@gmail.com'),
  ('sonakshi.sahu@gmail.com')
on conflict do nothing;


-- ─────────────────────────────────────────
-- 2. SECURITY DEFINER FUNCTION
--    Called from onboarding to link both emails to the newly created baby.
--    Runs as superuser to bypass RLS (needed to update the other person's row).
-- ─────────────────────────────────────────
create or replace function link_baby_to_access(p_baby_id uuid)
returns void as $$
begin
  update baby_access set baby_id = p_baby_id where baby_id is null;
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 3. UPDATE BABIES RLS
--    Old policy checked user_id = auth.uid() (single-owner).
--    New policy checks baby_access so both users can read/write.
-- ─────────────────────────────────────────
drop policy if exists "Users manage their own babies" on babies;

create policy "Users access their linked baby"
  on babies for all
  using  (id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (id in (select baby_id from baby_access where user_id = auth.uid()));


-- ─────────────────────────────────────────
-- 4. UPDATE ALL OTHER TABLE RLS POLICIES
--    They previously checked: baby_id in (select id from babies where user_id = auth.uid())
--    Now they check via baby_access instead.
-- ─────────────────────────────────────────

-- FEEDINGS
drop policy if exists "Users manage feedings for their babies" on feedings;
create policy "Users manage feedings for their babies"
  on feedings for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- SLEEPS
drop policy if exists "Users manage sleeps for their babies" on sleeps;
create policy "Users manage sleeps for their babies"
  on sleeps for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- DIAPERS
drop policy if exists "Users manage diapers for their babies" on diapers;
create policy "Users manage diapers for their babies"
  on diapers for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- GROWTH RECORDS
drop policy if exists "Users manage growth records for their babies" on growth_records;
create policy "Users manage growth records for their babies"
  on growth_records for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- MILESTONES
drop policy if exists "Users manage milestones for their babies" on milestones;
create policy "Users manage milestones for their babies"
  on milestones for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- VACCINE RECORDS
drop policy if exists "Users manage vaccine records for their babies" on vaccine_records;
create policy "Users manage vaccine records for their babies"
  on vaccine_records for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- MEDICINE LOGS
drop policy if exists "Users manage medicine logs for their babies" on medicine_logs;
create policy "Users manage medicine logs for their babies"
  on medicine_logs for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- SHARE TOKENS (keep public read policy, update the owner policy)
drop policy if exists "Users manage share tokens for their babies" on share_tokens;
create policy "Users manage share tokens for their babies"
  on share_tokens for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- TIP CACHE
drop policy if exists "Users manage tip cache for their babies" on tip_cache;
create policy "Users manage tip cache for their babies"
  on tip_cache for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- PRODUCT CACHE
drop policy if exists "Users manage product cache for their babies" on product_cache;
create policy "Users manage product cache for their babies"
  on product_cache for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));
