-- Run in Supabase SQL Editor after accounts.sql.
-- Admin membership is stored outside the exposed API schema.
begin;
create schema if not exists t5_admin;
revoke all on schema t5_admin from public, anon;
grant usage on schema t5_admin to authenticated;

create table if not exists t5_admin.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table t5_admin.site_admins enable row level security;
revoke all on t5_admin.site_admins from public, anon, authenticated;

create or replace function t5_admin.is_site_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from t5_admin.site_admins a where a.user_id = auth.uid()
  );
$$;

create or replace function t5_admin.list_player_saves(p_search text, p_offset integer)
returns table(user_id uuid, username text, updated_at timestamptz, version bigint, total_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not t5_admin.is_site_admin() then
    raise exception 'Site administrator access required.' using errcode = '42501';
  end if;
  return query
    select s.user_id,
      coalesce(nullif(left(u.raw_user_meta_data->>'username', 24), ''), 'Player') as username,
      s.updated_at, s.version, count(*) over ()
    from public.player_saves s
    join auth.users u on u.id = s.user_id
    where coalesce(u.raw_user_meta_data->>'username', '') ilike '%' || left(coalesce(p_search, ''), 100) || '%'
       or s.user_id::text ilike '%' || left(coalesce(p_search, ''), 100) || '%'
    order by s.updated_at desc, s.user_id
    limit 50 offset greatest(0, least(coalesce(p_offset, 0), 100000));
end;
$$;

create or replace function t5_admin.get_player_save(p_user_id uuid)
returns table(user_id uuid, username text, updated_at timestamptz, version bigint, progress jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not t5_admin.is_site_admin() then
    raise exception 'Site administrator access required.' using errcode = '42501';
  end if;
  return query
    select s.user_id,
      coalesce(nullif(left(u.raw_user_meta_data->>'username', 24), ''), 'Player'),
      s.updated_at, s.version, s.progress
    from public.player_saves s join auth.users u on u.id = s.user_id
    where s.user_id = p_user_id;
end;
$$;

-- Exposed entry points are invoker wrappers. Privileged functions remain in t5_admin.
create or replace function public.is_site_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select t5_admin.is_site_admin();
$$;
create or replace function public.admin_list_saves(p_search text default '', p_offset integer default 0)
returns table(user_id uuid, username text, updated_at timestamptz, version bigint, total_count bigint)
language sql stable security invoker set search_path = '' as $$
  select * from t5_admin.list_player_saves(p_search, p_offset);
$$;
create or replace function public.admin_get_save(p_user_id uuid)
returns table(user_id uuid, username text, updated_at timestamptz, version bigint, progress jsonb)
language sql stable security invoker set search_path = '' as $$
  select * from t5_admin.get_player_save(p_user_id);
$$;

revoke all on function t5_admin.is_site_admin() from public, anon, authenticated;
revoke all on function t5_admin.list_player_saves(text, integer) from public, anon, authenticated;
revoke all on function t5_admin.get_player_save(uuid) from public, anon, authenticated;
grant execute on function t5_admin.is_site_admin() to authenticated;
grant execute on function t5_admin.list_player_saves(text, integer) to authenticated;
grant execute on function t5_admin.get_player_save(uuid) to authenticated;

revoke all on function public.is_site_admin() from public, anon, authenticated;
revoke all on function public.admin_list_saves(text, integer) from public, anon, authenticated;
revoke all on function public.admin_get_save(uuid) from public, anon, authenticated;
grant execute on function public.is_site_admin() to authenticated;
grant execute on function public.admin_list_saves(text, integer) to authenticated;
grant execute on function public.admin_get_save(uuid) to authenticated;

commit;

-- ASSIGN YOUR ACCOUNT: run the following separately after replacing YOUR_USER_UID
-- with the UID shown in Authentication > Users.
--
-- insert into t5_admin.site_admins (user_id)
-- values ('YOUR_USER_UID'::uuid) on conflict (user_id) do nothing;
--
-- To revoke access later:
-- delete from t5_admin.site_admins where user_id = 'YOUR_USER_UID'::uuid;
