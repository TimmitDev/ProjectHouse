create table public.household_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) between 1 and 3000),
  category text not null default 'general' check (
    category in (
      'general',
      'home',
      'finance',
      'shopping',
      'maintenance',
      'important',
      'other'
    )
  ),
  pinned boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index household_notes_household_pinned_updated_idx
  on public.household_notes(household_id, pinned desc, updated_at desc);

alter table public.household_notes enable row level security;

create policy "Members can view household notes"
on public.household_notes for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create household notes"
on public.household_notes for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
);

create policy "Members can update household notes"
on public.household_notes for update
to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can delete household notes"
on public.household_notes for delete
to authenticated
using (
  (select private.is_household_member(household_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_household_admin(household_id))
  )
);

grant select, insert, delete
on public.household_notes
to authenticated;

grant update (
  title,
  body,
  category,
  pinned,
  updated_at
)
on public.household_notes
to authenticated;

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
    (new_household_id, 'groceries', false),
    (new_household_id, 'notes', false);

  update public.profiles
  set
    onboarding_complete = true,
    currency = upper(household_currency),
    updated_at = now()
  where id = current_user_id;

  return new_household_id;
end;
$$;

create or replace function public.create_additional_household(
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
    (new_household_id, 'groceries', false),
    (new_household_id, 'notes', false);

  return new_household_id;
end;
$$;

grant execute on function public.create_household(text, text) to authenticated;
grant execute
on function public.create_additional_household(text, text)
to authenticated;
