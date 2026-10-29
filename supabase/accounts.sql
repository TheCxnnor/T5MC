-- Run once in the Supabase SQL Editor. Safe to re-run for this schema.
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint progress_is_object check (jsonb_typeof(progress) = 'object'),
  constraint progress_size check (octet_length(progress::text) <= 1048576)
);

alter table public.player_saves enable row level security;
revoke all on public.player_saves from anon, authenticated;
grant select, insert, update on public.player_saves to authenticated;

drop policy if exists "Read own save" on public.player_saves;
create policy "Read own save" on public.player_saves
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own save" on public.player_saves;
create policy "Create own save" on public.player_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own save" on public.player_saves;
create policy "Update own save" on public.player_saves
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Atomic version comparison prevents a stale tab/device overwriting a newer save.
create or replace function public.save_player_progress(
  p_progress jsonb, p_expected_version bigint
) returns table(version bigint, updated_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in before saving.';
  end if;
  if p_expected_version = 0 then
    return query
      insert into public.player_saves as s (user_id, progress)
      values (auth.uid(), p_progress)
      on conflict (user_id) do nothing
      returning s.version, s.updated_at;
  else
    return query
      update public.player_saves as s
      set progress = p_progress, version = s.version + 1, updated_at = now()
      where s.user_id = auth.uid() and s.version = p_expected_version
      returning s.version, s.updated_at;
  end if;
  if not found then
    raise exception 'Cloud save changed. Refresh cloud status and review before saving again.'
      using errcode = '40001';
  end if;
end;
$$;
revoke all on function public.save_player_progress(jsonb, bigint) from public, anon;
grant execute on function public.save_player_progress(jsonb, bigint) to authenticated;
