create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  award text check (award in ('MA000003','MA000119','MA000009')),
  classification smallint check (classification between 1 and 5),
  visa_type text check (visa_type in ('student_500','other')),
  semester_start date,
  semester_end date,
  base_rate numeric(6,2) not null default 26.44,
  casual_loading numeric(5,2) not null default 25,
  saturday_multiplier numeric(4,2) not null default 1.25,
  sunday_multiplier numeric(4,2) not null default 1.50,
  public_holiday_multiplier numeric(4,2) not null default 2.25,
  setup_complete boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  shift_date date not null,
  employer text not null check (char_length(employer) between 1 and 80),
  start_time time not null,
  finish_time time not null,
  unpaid_break_minutes smallint not null default 0
    check (unpaid_break_minutes between 0 and 600),
  is_public_holiday boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shifts_user_date_idx
  on public.shifts (user_id, shift_date desc);

alter table public.profiles enable row level security;
alter table public.shifts   enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists shifts_select_own on public.shifts;
create policy shifts_select_own on public.shifts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists shifts_insert_own on public.shifts;
create policy shifts_insert_own on public.shifts
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists shifts_update_own on public.shifts;
create policy shifts_update_own on public.shifts
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists shifts_delete_own on public.shifts;
create policy shifts_delete_own on public.shifts
  for delete to authenticated using (auth.uid() = user_id);

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.shifts to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
