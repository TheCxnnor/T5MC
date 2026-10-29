-- Run the complete script in Supabase SQL Editor.
-- The Main Minecraft username is the authoritative site display name.
-- This updates only username metadata, never saves, user IDs, identities or admin roles.
begin;

create schema if not exists t5_profile_sync;
revoke all on schema t5_profile_sync from public, anon, authenticated;

create or replace function t5_profile_sync.main_username(p_progress jsonb, p_user_id uuid)
returns text language plpgsql immutable security invoker set search_path = '' as $$
declare
  directory jsonb;
  profile jsonb;
  candidate text;
begin
  begin
    directory := (p_progress->>'t5-mission-control-profiles')::jsonb;
  exception when invalid_text_representation then
    return null;
  end;
  if jsonb_typeof(directory) is distinct from 'object'
     or directory->>'ownerId' is distinct from p_user_id::text
     or jsonb_typeof(directory->'profiles') is distinct from 'array' then
    return null;
  end if;
  for profile in select value from jsonb_array_elements(directory->'profiles') loop
    if profile->>'id' = 'main' then
      candidate := profile->>'username';
      if candidate ~ '^[A-Za-z0-9_]{3,16}$' then
        return candidate;
      end if;
      return null;
    end if;
  end loop;
  return null;
end;
$$;

create or replace function t5_profile_sync.sync_main_username()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  main_name text;
begin
  main_name := t5_profile_sync.main_username(new.progress, new.user_id);
  if main_name is not null then
    update auth.users as u
    set raw_user_meta_data =
      (case when jsonb_typeof(u.raw_user_meta_data) = 'object'
        then u.raw_user_meta_data else '{}'::jsonb end)
      || jsonb_build_object('username', main_name),
      updated_at = now()
    where u.id = new.user_id
      and u.raw_user_meta_data->>'username' is distinct from main_name;
  end if;
  return new;
end;
$$;

revoke all on function t5_profile_sync.main_username(jsonb, uuid) from public, anon, authenticated;
revoke all on function t5_profile_sync.sync_main_username() from public, anon, authenticated;

drop trigger if exists t5_sync_main_username on public.player_saves;
create trigger t5_sync_main_username
after insert or update of progress on public.player_saves
for each row execute function t5_profile_sync.sync_main_username();

-- Keep Discord metadata refreshes from replacing an already chosen Main name.
create or replace function t5_profile_sync.enforce_site_username()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  main_name text;
begin
  select t5_profile_sync.main_username(s.progress, s.user_id)
    into main_name from public.player_saves as s where s.user_id = new.id;
  if main_name is not null then
    new.raw_user_meta_data :=
      (case when jsonb_typeof(new.raw_user_meta_data) = 'object'
        then new.raw_user_meta_data else '{}'::jsonb end)
      || jsonb_build_object('username', main_name);
  end if;
  return new;
end;
$$;
revoke all on function t5_profile_sync.enforce_site_username() from public, anon, authenticated;
drop trigger if exists t5_keep_main_username on auth.users;
create trigger t5_keep_main_username
before update of raw_user_meta_data on auth.users
for each row execute function t5_profile_sync.enforce_site_username();

-- Bring existing cloud-saved Main usernames into line immediately.
update auth.users as u
set raw_user_meta_data =
    (case when jsonb_typeof(u.raw_user_meta_data) = 'object'
      then u.raw_user_meta_data else '{}'::jsonb end)
    || jsonb_build_object('username', t5_profile_sync.main_username(s.progress, s.user_id)),
    updated_at = now()
from public.player_saves as s
where u.id = s.user_id
  and t5_profile_sync.main_username(s.progress, s.user_id) is not null
  and u.raw_user_meta_data->>'username'
    is distinct from t5_profile_sync.main_username(s.progress, s.user_id);

commit;
