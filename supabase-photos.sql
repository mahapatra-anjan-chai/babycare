-- ============================================================
-- BabyCare — Baby Photos Migration
-- Run this in Supabase SQL Editor AFTER running supabase-shared-access.sql
-- ============================================================

-- BABY PHOTOS TABLE
create table if not exists baby_photos (
  id           uuid primary key default uuid_generate_v4(),
  baby_id      uuid references babies(id) on delete cascade,
  storage_path text not null,        -- {baby_id}/YYYY/MM/{uuid}.jpg
  photo_url    text not null,        -- Supabase public URL
  caption      text,
  taken_at     date not null default current_date,
  created_at   timestamptz default now()
);

alter table baby_photos enable row level security;

-- Both Anjan & Sonakshi can manage photos (via baby_access)
create policy "Users manage photos for their babies"
  on baby_photos for all
  using  (baby_id in (select baby_id from baby_access where user_id = auth.uid()))
  with check (baby_id in (select baby_id from baby_access where user_id = auth.uid()));

-- Grandparent share links can read photos
create policy "Public can read photos for active share tokens"
  on baby_photos for select
  using (baby_id in (select baby_id from share_tokens where is_active = true));

create index baby_photos_taken_idx on baby_photos(baby_id, taken_at desc);

-- ============================================================
-- Supabase Storage: create bucket manually in the dashboard
--   Name:    baby-photos
--   Public:  true (so photo_url works directly without signed URLs)
-- Then add this storage policy in Storage > Policies:
--   Authenticated users can upload to their baby's folder
-- ============================================================
