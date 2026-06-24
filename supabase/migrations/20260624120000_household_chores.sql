create table public.household_chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  area text not null default 'other' check (
    area in (
      'kitchen',
      'bathroom',
      'living',
      'bedroom',
      'outside',
      'admin',
      'other'
    )
  ),
  frequency text not null default 'weekly' check (
    frequency in ('once', 'daily', 'weekly', 'biweekly', 'monthly')
  ),
  due_date date not null default current_date,
  assigned_to uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  last_completed_at timestamptz,
  last_completed_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index household_chores_household_due_idx
  on public.household_chores(household_id, completed_at, due_date);

alter table public.household_chores enable row level security;

create policy "Members can view household chores"
on public.household_chores for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create household chores"
on public.household_chores for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and (
    assigned_to is null
    or exists (
      select 1
      from public.household_members
      where household_id = household_chores.household_id
        and user_id = assigned_to
    )
  )
  and created_by = (select auth.uid())
);

create policy "Members can update household chores"
on public.household_chores for update
to authenticated
using ((select private.is_household_member(household_id)))
with check (
  (select private.is_household_member(household_id))
  and (
    assigned_to is null
    or exists (
      select 1
      from public.household_members
      where household_id = household_chores.household_id
        and user_id = assigned_to
    )
  )
);

create policy "Members can delete household chores"
on public.household_chores for delete
to authenticated
using (
  (select private.is_household_member(household_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_household_admin(household_id))
  )
);

grant select, insert, delete
on public.household_chores
to authenticated;

grant update (
  title,
  description,
  area,
  frequency,
  due_date,
  assigned_to,
  completed_at,
  completed_by,
  last_completed_at,
  last_completed_by,
  updated_at
)
on public.household_chores
to authenticated;
