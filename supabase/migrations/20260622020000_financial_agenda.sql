create type public.financial_recurrence as enum (
  'none',
  'weekly',
  'monthly',
  'yearly'
);

create table public.financial_agenda_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (char_length(category) between 1 and 50),
  amount numeric(14, 2) not null check (amount > 0),
  type public.transaction_type not null default 'expense',
  due_date date not null,
  recurrence public.financial_recurrence not null default 'none',
  assigned_to uuid not null references auth.users(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index financial_agenda_household_date_idx
  on public.financial_agenda_items(household_id, due_date);

alter table public.financial_agenda_items enable row level security;

create policy "Members can view financial agenda items"
on public.financial_agenda_items for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create financial agenda items"
on public.financial_agenda_items for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
  and exists (
    select 1
    from public.household_members
    where household_id = financial_agenda_items.household_id
      and user_id = financial_agenda_items.assigned_to
  )
);

create policy "Members can update financial agenda items"
on public.financial_agenda_items for update
to authenticated
using ((select private.is_household_member(household_id)))
with check (
  (select private.is_household_member(household_id))
  and exists (
    select 1
    from public.household_members
    where household_id = financial_agenda_items.household_id
      and user_id = financial_agenda_items.assigned_to
  )
);

create policy "Members can delete financial agenda items"
on public.financial_agenda_items for delete
to authenticated
using (
  (select private.is_household_member(household_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_household_admin(household_id))
  )
);

grant select, insert, update, delete
on public.financial_agenda_items
to authenticated;
