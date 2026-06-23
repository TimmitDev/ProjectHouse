create table public.savings_pots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 180),
  target_amount numeric(14, 2) check (target_amount is null or target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  color text not null default '#52796F' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.savings_pot_entries (
  id uuid primary key default gen_random_uuid(),
  pot_id uuid not null references public.savings_pots(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  amount numeric(14, 2) not null check (amount <> 0),
  note text not null default '' check (char_length(note) <= 120),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index savings_pots_household_created_idx
  on public.savings_pots(household_id, created_at desc);

create index savings_pot_entries_pot_created_idx
  on public.savings_pot_entries(pot_id, created_at desc);

alter table public.savings_pots enable row level security;
alter table public.savings_pot_entries enable row level security;

create policy "Members can view savings pots"
on public.savings_pots for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create savings pots"
on public.savings_pots for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
  and current_amount = 0
);

create policy "Members can update savings pots"
on public.savings_pots for update
to authenticated
using ((select private.is_household_member(household_id)))
with check ((select private.is_household_member(household_id)));

create policy "Members can delete savings pots"
on public.savings_pots for delete
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can view savings pot entries"
on public.savings_pot_entries for select
to authenticated
using ((select private.is_household_member(household_id)));

create or replace function public.adjust_savings_pot(
  target_pot_id uuid,
  adjustment_amount numeric,
  entry_note text default ''
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_household_id uuid;
  updated_amount numeric;
begin
  if current_user_id is null then
    raise exception 'Authenticatie vereist';
  end if;

  if adjustment_amount = 0 then
    raise exception 'Het bedrag mag niet nul zijn';
  end if;

  select pot.household_id
  into target_household_id
  from public.savings_pots pot
  where pot.id = target_pot_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = pot.household_id
        and member.user_id = current_user_id
    )
  for update;

  if target_household_id is null then
    raise exception 'Spaarpotje niet gevonden';
  end if;

  update public.savings_pots
  set
    current_amount = current_amount + adjustment_amount,
    updated_at = now()
  where id = target_pot_id
    and current_amount + adjustment_amount >= 0
  returning current_amount into updated_amount;

  if updated_amount is null then
    raise exception 'Onvoldoende saldo in dit spaarpotje';
  end if;

  insert into public.savings_pot_entries (
    pot_id,
    household_id,
    amount,
    note,
    created_by
  )
  values (
    target_pot_id,
    target_household_id,
    adjustment_amount,
    left(trim(coalesce(entry_note, '')), 120),
    current_user_id
  );

  return updated_amount;
end;
$$;

grant select, insert, delete
on public.savings_pots
to authenticated;

grant update (name, description, target_amount, color, updated_at)
on public.savings_pots
to authenticated;

grant select
on public.savings_pot_entries
to authenticated;

revoke all on function public.adjust_savings_pot(uuid, numeric, text)
from public;

grant execute on function public.adjust_savings_pot(uuid, numeric, text)
to authenticated;
