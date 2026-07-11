
-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id);

-- ============ roles ============
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "user_roles self read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

-- ============ signup trigger: profile + first-user-becomes-admin ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  admin_count int;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);

  select count(*) into admin_count from public.user_roles where role = 'admin';
  if admin_count = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ bookings ============
create type public.booking_status as enum ('new', 'contacted', 'confirmed', 'declined', 'cancelled');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  total_guests int not null check (total_guests > 0),
  check_in date not null,
  check_out date not null,
  phone text,
  notes text,
  status public.booking_status not null default 'confirmed',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);
grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;

create policy "bookings admins read"   on public.bookings for select to authenticated using (public.is_admin());
create policy "bookings admins insert" on public.bookings for insert to authenticated with check (public.is_admin());
create policy "bookings admins update" on public.bookings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "bookings admins delete" on public.bookings for delete to authenticated using (public.is_admin());

create index bookings_check_in_idx on public.bookings (check_in);
create index bookings_check_out_idx on public.bookings (check_out);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
