create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  quantity text not null default '1' check (char_length(quantity) between 1 and 30),
  category text not null default 'other' check (
    category in (
      'produce',
      'bakery',
      'dairy',
      'meat',
      'pantry',
      'frozen',
      'drinks',
      'household',
      'other'
    )
  ),
  completed boolean not null default false,
  added_by uuid references auth.users(id) on delete set null,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index grocery_items_household_status_category_idx
  on public.grocery_items(household_id, completed, category, created_at desc);

alter table public.grocery_items enable row level security;

create policy "Members can view grocery items"
on public.grocery_items for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create grocery items"
on public.grocery_items for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and added_by = (select auth.uid())
  and completed = false
  and completed_by is null
);

create policy "Members can update grocery items"
on public.grocery_items for update
to authenticated
using ((select private.is_household_member(household_id)))
with check (
  (select private.is_household_member(household_id))
  and (
    completed_by is null
    or completed_by = (select auth.uid())
  )
);

create policy "Members can delete grocery items"
on public.grocery_items for delete
to authenticated
using ((select private.is_household_member(household_id)));

grant select, insert, delete
on public.grocery_items
to authenticated;

grant update (
  name,
  quantity,
  category,
  completed,
  completed_by,
  completed_at,
  updated_at
)
on public.grocery_items
to authenticated;
