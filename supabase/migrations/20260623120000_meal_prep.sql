create table public.meal_prep_recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 240),
  ingredients text[] not null check (cardinality(ingredients) between 1 and 40),
  instructions text not null default '' check (char_length(instructions) <= 2000),
  servings smallint not null default 2 check (servings between 1 and 30),
  prep_minutes smallint not null default 30 check (prep_minutes between 1 and 1440),
  storage_method text not null default 'fridge' check (
    storage_method in ('fridge', 'freezer', 'room_temperature')
  ),
  shelf_life_days smallint not null default 3 check (
    shelf_life_days between 1 and 365
  ),
  last_prepared_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meal_prep_recipes_household_created_idx
  on public.meal_prep_recipes(household_id, created_at desc);

alter table public.meal_prep_recipes enable row level security;

create policy "Members can view meal prep recipes"
on public.meal_prep_recipes for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create meal prep recipes"
on public.meal_prep_recipes for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
  and last_prepared_at is null
);

create policy "Members can update meal prep recipes"
on public.meal_prep_recipes for update
to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can delete meal prep recipes"
on public.meal_prep_recipes for delete
to authenticated
using ((select private.is_household_member(household_id)));

grant select, insert, delete
on public.meal_prep_recipes
to authenticated;

grant update (
  name,
  description,
  ingredients,
  instructions,
  servings,
  prep_minutes,
  storage_method,
  shelf_life_days,
  last_prepared_at,
  updated_at
)
on public.meal_prep_recipes
to authenticated;
