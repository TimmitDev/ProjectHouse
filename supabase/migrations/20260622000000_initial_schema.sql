create extension if not exists pgcrypto;

create type public.household_role as enum ('owner', 'admin', 'member');
create type public.module_key as enum ('finances', 'calendar', 'chores', 'groceries');
create type public.transaction_type as enum ('income', 'expense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  locale text not null default 'nl-NL',
  currency text not null default 'EUR',
  accent_color text not null default '#52796F',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  invite_code text not null unique,
  currency text not null default 'EUR',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.household_modules (
  household_id uuid not null references public.households(id) on delete cascade,
  module_key public.module_key not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (household_id, module_key)
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  color text not null default '#52796F',
  icon text not null default 'target',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  description text not null check (char_length(description) between 1 and 120),
  category text not null check (char_length(category) between 1 and 50),
  amount numeric(14, 2) not null check (amount > 0),
  type public.transaction_type not null,
  transaction_date date not null default current_date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index household_members_user_id_idx on public.household_members(user_id);
create index household_modules_household_id_idx on public.household_modules(household_id);
create index savings_goals_household_id_idx on public.savings_goals(household_id);
create index transactions_household_date_idx
  on public.transactions(household_id, transaction_date desc);

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.is_household_admin(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

create or replace function private.shares_household(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members mine
    join public.household_members theirs
      on mine.household_id = theirs.household_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = target_user_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function private.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  generated_code text;
begin
  loop
    generated_code := upper(
      substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8)
    );
    exit when not exists (
      select 1 from public.households where invite_code = generated_code
    );
  end loop;
  return generated_code;
end;
$$;

create or replace function public.contribute_to_savings_goal(
  goal_id uuid,
  contribution_amount numeric
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_amount numeric;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authenticatie vereist';
  end if;

  if contribution_amount <= 0 then
    raise exception 'De bijdrage moet hoger zijn dan nul';
  end if;

  update public.savings_goals
  set
    current_amount = current_amount + contribution_amount,
    updated_at = now()
  where id = goal_id
    and exists (
      select 1
      from public.household_members
      where household_id = savings_goals.household_id
        and user_id = current_user_id
    )
  returning current_amount into updated_amount;

  if updated_amount is null then
    raise exception 'Spaardoel niet gevonden';
  end if;

  return updated_amount;
end;
$$;

create or replace function public.create_household(
  household_name text,
  household_currency text default 'EUR'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authenticatie vereist';
  end if;

  if char_length(trim(household_name)) < 2 then
    raise exception 'De huishoudnaam is te kort';
  end if;

  if exists (
    select 1 from public.household_members where user_id = current_user_id
  ) then
    raise exception 'Je bent al lid van een huishouden';
  end if;

  insert into public.households (name, invite_code, currency, created_by)
  values (
    trim(household_name),
    private.generate_invite_code(),
    upper(household_currency),
    current_user_id
  )
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, current_user_id, 'owner');

  insert into public.household_modules (household_id, module_key, enabled)
  values
    (new_household_id, 'finances', true),
    (new_household_id, 'calendar', false),
    (new_household_id, 'chores', false),
    (new_household_id, 'groceries', false);

  update public.profiles
  set
    onboarding_complete = true,
    currency = upper(household_currency),
    updated_at = now()
  where id = current_user_id;

  return new_household_id;
end;
$$;

create or replace function public.join_household(household_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_household_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authenticatie vereist';
  end if;

  if exists (
    select 1 from public.household_members where user_id = current_user_id
  ) then
    raise exception 'Je bent al lid van een huishouden';
  end if;

  select id into target_household_id
  from public.households
  where invite_code = upper(trim(household_code));

  if target_household_id is null then
    raise exception 'Geen huishouden gevonden met deze code';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_household_id, current_user_id, 'member');

  update public.profiles
  set onboarding_complete = true, updated_at = now()
  where id = current_user_id;

  return target_household_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_modules enable row level security;
alter table public.savings_goals enable row level security;
alter table public.transactions enable row level security;

create policy "Users can view connected profiles"
on public.profiles for select
to authenticated
using (
  (select auth.uid()) = id
  or (select private.shares_household(id))
);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Members can view their household"
on public.households for select
to authenticated
using ((select private.is_household_member(id)));

create policy "Members can view household memberships"
on public.household_members for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Admins can update member roles"
on public.household_members for update
to authenticated
using ((select private.is_household_admin(household_id)))
with check ((select private.is_household_admin(household_id)));

create policy "Members can view modules"
on public.household_modules for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Admins can insert modules"
on public.household_modules for insert
to authenticated
with check ((select private.is_household_admin(household_id)));

create policy "Admins can update modules"
on public.household_modules for update
to authenticated
using ((select private.is_household_admin(household_id)))
with check ((select private.is_household_admin(household_id)));

create policy "Members can view savings goals"
on public.savings_goals for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create savings goals"
on public.savings_goals for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
);

create policy "Members can update savings goals"
on public.savings_goals for update
to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Admins can delete savings goals"
on public.savings_goals for delete
to authenticated
using ((select private.is_household_admin(household_id)));

create policy "Members can view transactions"
on public.transactions for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create transactions"
on public.transactions for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
);

create policy "Members can update their transactions"
on public.transactions for update
to authenticated
using (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
)
with check ((select private.is_household_member(household_id)));

create policy "Members can delete their transactions"
on public.transactions for delete
to authenticated
using (
  (select private.is_household_member(household_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_household_admin(household_id))
  )
);

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.households to authenticated;
grant select, update on public.household_members to authenticated;
grant select, insert, update on public.household_modules to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.contribute_to_savings_goal(uuid, numeric) to authenticated;

revoke all on function private.is_household_member(uuid) from public;
revoke all on function private.is_household_admin(uuid) from public;
revoke all on function private.shares_household(uuid) from public;
revoke all on function private.generate_invite_code() from public;

grant usage on schema private to authenticated;
grant execute on function private.is_household_member(uuid) to authenticated;
grant execute on function private.is_household_admin(uuid) to authenticated;
grant execute on function private.shares_household(uuid) to authenticated;
