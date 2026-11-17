-- =====================================================================================
-- Greenzone Learning Hub: database, security rules and video storage for Supabase.
--
-- 1. Change the email on the last lines of this file to the one you will sign in with
--    as the administrator.
-- 2. Paste the whole file into Supabase > SQL Editor and click Run.
--
-- It is safe to run again later: it only adds what is missing and refreshes the rules.
-- =====================================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- Tables

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  role text not null default 'PARENT' check (role in ('PARENT', 'TEACHER', 'ADMIN')),
  subscription_ends_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (lower(email));

-- Emails that get a role other than Parent when they sign up (teachers added by the admin, and the admin).
create table if not exists public.role_invites (
  email text primary key,
  role text not null check (role in ('TEACHER', 'ADMIN')),
  name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  hub text not null check (hub in ('PARENTS', 'TEACHERS')),
  topic_id uuid references public.topics (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  position integer not null default 0,
  source_type text not null check (source_type in ('FILE', 'URL', 'YOUTUBE')),
  source text not null,
  -- The YouTube id is used for thumbnails. File names and video links stay hidden (see the column rules below).
  thumb_id text generated always as (case when source_type = 'YOUTUBE' then source end) stored,
  duration_seconds integer not null default 0,
  resource_url text not null default '',
  resource_label text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists videos_hub_published_idx on public.videos (hub, published);

create table if not exists public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  position_seconds integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  email text not null,
  user_id uuid references public.profiles (id) on delete set null,
  amount text not null default '',
  source text not null default 'selar' check (source in ('selar', 'manual')),
  raw text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text not null default ''
);
insert into public.settings (key, value) values ('selar_url', ''), ('support_email', '') on conflict (key) do nothing;

-- ---------------------------------------------------------------- Helper rules

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_subscribed(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select subscription_ends_at > now() from profiles where id = uid), false)
$$;

-- A teacher's course is open when every published course before it (that has modules) is finished.
create or replace function public.course_unlocked(cid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from courses where id = cid and published)
    and not exists (
      select 1
      from courses c, courses t
      where t.id = cid
        and c.published
        and (c.position, c.created_at, c.id) < (t.position, t.created_at, t.id)
        and exists (
          select 1 from videos v
          where v.course_id = c.id and v.hub = 'TEACHERS' and v.published
            and not exists (select 1 from progress p where p.user_id = uid and p.video_id = v.id and p.completed)
        )
    )
$$;

-- Can the signed-in person play this video?
create or replace function public.can_watch(vid uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  r text;
  v videos;
begin
  select role into r from profiles where id = auth.uid();
  if r is null then return false; end if;
  select * into v from videos where id = vid;
  if not found then return false; end if;
  if r = 'ADMIN' then return true; end if;
  if not v.published then return false; end if;
  if r = 'PARENT' then return v.hub = 'PARENTS' and is_subscribed(auth.uid()); end if;
  if r = 'TEACHER' then
    return v.hub = 'TEACHERS' and v.course_id is not null and course_unlocked(v.course_id, auth.uid());
  end if;
  return false;
end $$;

-- The file name, link or YouTube id of a video, only for people allowed to watch it.
create or replace function public.video_source(vid uuid) returns text
language sql stable security definer set search_path = public as $$
  select source from videos where id = vid and can_watch(vid)
$$;

create or replace function public.can_read_video_file(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from videos where source_type = 'FILE' and source = object_name and can_watch(id))
$$;

create or replace function public.extend_year(uid uuid) returns void
language sql security definer set search_path = public as $$
  update profiles
  set subscription_ends_at = (case when subscription_ends_at > now() then subscription_ends_at else now() end) + interval '1 year'
  where id = uid
$$;

-- ---------------------------------------------------------------- Actions the site calls

-- Saves where the viewer is in a video. Once watched, a video stays watched.
create or replace function public.save_progress(vid uuid, pos integer, dur integer, done boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  before boolean;
begin
  if auth.uid() is null or not can_watch(vid) then
    raise exception 'You cannot watch this video.' using errcode = '42501';
  end if;
  pos := greatest(0, coalesce(pos, 0));
  dur := greatest(0, coalesce(dur, 0));
  done := coalesce(done, false);
  if dur > 0 then
    update videos set duration_seconds = dur where id = vid and duration_seconds <> dur;
  end if;
  select completed into before from progress where user_id = auth.uid() and video_id = vid;
  insert into progress (user_id, video_id, position_seconds, completed, completed_at, updated_at)
  values (auth.uid(), vid, pos, done, case when done then now() end, now())
  on conflict (user_id, video_id) do update set
    position_seconds = excluded.position_seconds,
    updated_at = now(),
    completed = progress.completed or excluded.completed,
    completed_at = case when progress.completed then progress.completed_at when excluded.completed then now() end;
  return coalesce(before, false) or done;
end $$;

create or replace function public.update_my_name(new_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(new_name, ''))) < 2 then raise exception 'Please enter your full name.'; end if;
  update profiles set name = trim(new_name) where id = auth.uid();
end $$;

create or replace function public.grant_year(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  p profiles;
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select * into p from profiles where id = uid;
  if not found or p.role <> 'PARENT' then return; end if;
  perform extend_year(uid);
  insert into payments (reference, email, user_id, source) values ('manual-' || gen_random_uuid(), p.email, uid, 'manual');
end $$;

create or replace function public.revoke_access(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  update profiles set subscription_ends_at = null where id = uid and role = 'PARENT';
end $$;

-- Sets a new password for someone and signs them out everywhere.
create or replace function public.set_user_password(uid uuid, new_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  if length(coalesce(new_password, '')) < 8 then raise exception 'The password needs at least 8 characters.'; end if;
  update auth.users set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
  where id = uid;
  begin
    -- Sign them out everywhere (skipped quietly if this project does not allow it).
    execute 'delete from auth.sessions where user_id = $1' using uid;
  exception when others then
    null;
  end;
end $$;

create or replace function public.remove_person(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  if uid = auth.uid() then return; end if;
  delete from auth.users where id = uid and exists (select 1 from profiles where id = uid and role <> 'ADMIN');
end $$;

-- Gives an email free Teachers Hub access: straight away if it already has an account, otherwise when it signs up.
create or replace function public.add_teacher(teacher_name text, teacher_email text) returns text
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(trim(coalesce(teacher_email, '')));
  n text := trim(coalesce(teacher_name, ''));
  existing profiles;
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  if length(n) < 2 then raise exception 'Please enter the teacher''s name.'; end if;
  if e !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Please enter a valid email address.'; end if;
  select * into existing from profiles where lower(email) = e;
  if found then
    if existing.role = 'ADMIN' then raise exception 'That email belongs to an administrator.'; end if;
    update profiles set role = 'TEACHER', name = n where id = existing.id;
    return 'converted';
  end if;
  insert into role_invites (email, role, name) values (e, 'TEACHER', n)
  on conflict (email) do update set role = 'TEACHER', name = excluded.name;
  return 'invited';
end $$;

create or replace function public.admin_people(search text, only_role text)
returns table (id uuid, name text, email text, role text, subscription_ends_at timestamptz, created_at timestamptz, done bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  q text := trim(coalesce(search, ''));
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select p.id, p.name, p.email, p.role, p.subscription_ends_at, p.created_at,
      (select count(*) from progress g where g.user_id = p.id and g.completed)
    from profiles p
    where (case when coalesce(only_role, '') = '' then p.role <> 'ADMIN' else p.role = only_role end)
      and (q = '' or p.name ilike '%' || q || '%' or p.email ilike '%' || q || '%')
    order by p.created_at desc
    limit 200;
end $$;

create or replace function public.admin_video_completions()
returns table (video_id uuid, done bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query select g.video_id, count(*) from progress g where g.completed group by g.video_id;
end $$;

-- Moves a video one place up or down among the videos it sits with.
create or replace function public.move_video(vid uuid, dir text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v videos;
  ids uuid[];
  i integer;
  j integer;
  tmp uuid;
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select * into v from videos where id = vid;
  if not found then return; end if;
  select array_agg(x.id order by x.position, x.created_at, x.id) into ids
  from videos x where x.hub = v.hub and x.course_id is not distinct from v.course_id;
  i := array_position(ids, vid);
  j := case when dir = 'up' then i - 1 else i + 1 end;
  if j < 1 or j > array_length(ids, 1) then return; end if;
  tmp := ids[i]; ids[i] := ids[j]; ids[j] := tmp;
  update videos set position = array_position(ids, videos.id) where videos.id = any (ids);
end $$;

create or replace function public.move_course(cid uuid, dir text) returns void
language plpgsql security definer set search_path = public as $$
declare
  ids uuid[];
  i integer;
  j integer;
  tmp uuid;
begin
  if not is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  select array_agg(x.id order by x.position, x.created_at, x.id) into ids from courses x;
  i := array_position(ids, cid);
  if i is null then return; end if;
  j := case when dir = 'up' then i - 1 else i + 1 end;
  if j < 1 or j > array_length(ids, 1) then return; end if;
  tmp := ids[i]; ids[i] := ids[j]; ids[j] := tmp;
  update courses set position = array_position(ids, courses.id) where courses.id = any (ids);
end $$;

-- Called only by the Selar webhook (with the secret service key), never from the browser.
create or replace function public.record_selar_payment(buyer_email text, ref text, amt text, payload text) returns json
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(trim(coalesce(buyer_email, '')));
  uid uuid;
begin
  if exists (select 1 from payments where reference = ref) then
    return json_build_object('ok', true, 'duplicate', true);
  end if;
  select id into uid from profiles where lower(email) = e;
  insert into payments (reference, email, amount, source, raw, user_id)
  values (ref, e, coalesce(amt, ''), 'selar', left(coalesce(payload, ''), 5000), uid);
  if uid is not null then perform extend_year(uid); end if;
  return json_build_object('ok', true, 'matched', uid is not null);
end $$;

-- New sign-ups get a profile. Payments made before signing up are applied straight away.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(new.email);
  inv role_invites;
  pay record;
begin
  select * into inv from role_invites where email = e;
  insert into profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), nullif(inv.name, ''), split_part(e, '@', 1)),
    e,
    coalesce(inv.role, 'PARENT')
  )
  on conflict (id) do nothing;
  if inv.email is not null then delete from role_invites where email = e; end if;
  for pay in select id from payments where lower(email) = e and user_id is null loop
    update payments set user_id = new.id where id = pay.id;
    perform extend_year(new.id);
  end loop;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only the right people may run each action.
revoke execute on function public.extend_year(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.record_selar_payment(text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_selar_payment(text, text, text, text) to service_role;

-- ---------------------------------------------------------------- Row level security

alter table public.profiles enable row level security;
alter table public.role_invites enable row level security;
alter table public.topics enable row level security;
alter table public.courses enable row level security;
alter table public.videos enable row level security;
alter table public.progress enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;

drop policy if exists "read own profile, admin reads all" on public.profiles;
create policy "read own profile, admin reads all" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "admin reads invites" on public.role_invites;
create policy "admin reads invites" on public.role_invites
  for select to authenticated using (public.is_admin());
drop policy if exists "admin removes invites" on public.role_invites;
create policy "admin removes invites" on public.role_invites
  for delete to authenticated using (public.is_admin());

drop policy if exists "signed-in people read topics" on public.topics;
create policy "signed-in people read topics" on public.topics
  for select to authenticated using (true);
drop policy if exists "admin manages topics" on public.topics;
create policy "admin manages topics" on public.topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read published courses" on public.courses;
create policy "read published courses" on public.courses
  for select to authenticated using (published or public.is_admin());
drop policy if exists "admin manages courses" on public.courses;
create policy "admin manages courses" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read videos of your hub" on public.videos;
create policy "read videos of your hub" on public.videos
  for select to authenticated using (
    public.is_admin()
    or (published and (
      (hub = 'PARENTS' and public.my_role() = 'PARENT' and public.is_subscribed(auth.uid()))
      or (hub = 'TEACHERS' and public.my_role() = 'TEACHER')
    ))
  );
drop policy if exists "admin manages videos" on public.videos;
create policy "admin manages videos" on public.videos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read own progress, admin reads all" on public.progress;
create policy "read own progress, admin reads all" on public.progress
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "read own payments, admin reads all" on public.payments;
create policy "read own payments, admin reads all" on public.payments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "everyone reads settings" on public.settings;
create policy "everyone reads settings" on public.settings
  for select to anon, authenticated using (true);
drop policy if exists "admin manages settings" on public.settings;
create policy "admin manages settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The video file name or link is never readable directly: it is handed out by video_source() after the access check.
revoke select on public.videos from anon, authenticated;
grant select (id, title, description, hub, topic_id, course_id, position, source_type, thumb_id, duration_seconds,
  resource_url, resource_label, published, created_at) on public.videos to authenticated;

-- ---------------------------------------------------------------- Video storage

insert into storage.buckets (id, name, public) values ('videos', 'videos', false) on conflict (id) do nothing;

drop policy if exists "greenzone: admin manages video files" on storage.objects;
create policy "greenzone: admin manages video files" on storage.objects
  for all to authenticated using (bucket_id = 'videos' and public.is_admin()) with check (bucket_id = 'videos' and public.is_admin());

drop policy if exists "greenzone: viewers play video files" on storage.objects;
create policy "greenzone: viewers play video files" on storage.objects
  for select to authenticated using (bucket_id = 'videos' and public.can_read_video_file(name));

-- ---------------------------------------------------------------- Administrator
-- ▼▼▼ Put the email you will sign in with as the administrator here (keep the quotes). ▼▼▼
do $$
declare
  admin_email text := 'YOUR-EMAIL@example.com';
begin
  admin_email := lower(trim(admin_email));
  if admin_email = 'your-email@example.com' or admin_email !~ '@' then
    raise notice 'No administrator email set. Edit the last lines of this file and run it again.';
    return;
  end if;
  insert into public.role_invites (email, role, name) values (admin_email, 'ADMIN', 'Greenzone Admin')
  on conflict (email) do update set role = 'ADMIN';
  update public.profiles set role = 'ADMIN' where lower(email) = admin_email;
end $$;
