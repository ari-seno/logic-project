alter table public.profiles
  add column if not exists deleted_at timestamptz,
  add column if not exists purge_after timestamptz;

create index if not exists profiles_purge_after_idx
  on public.profiles (purge_after)
  where deleted_at is not null;
