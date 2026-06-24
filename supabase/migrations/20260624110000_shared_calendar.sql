create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  location text not null default '' check (char_length(location) <= 160),
  event_date date not null,
  start_time time,
  end_time time,
  all_day boolean not null default false,
  category text not null default 'other' check (
    category in (
      'home',
      'appointment',
      'school',
      'work',
      'social',
      'health',
      'travel',
      'other'
    )
  ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      all_day = true
      and start_time is null
      and end_time is null
    )
    or (
      all_day = false
      and start_time is not null
      and (
        end_time is null
        or end_time > start_time
      )
    )
  )
);

create index calendar_events_household_date_idx
  on public.calendar_events(household_id, event_date, start_time);

alter table public.calendar_events enable row level security;

create policy "Members can view calendar events"
on public.calendar_events for select
to authenticated
using ((select private.is_household_member(household_id)));

create policy "Members can create calendar events"
on public.calendar_events for insert
to authenticated
with check (
  (select private.is_household_member(household_id))
  and created_by = (select auth.uid())
);

create policy "Members can update their calendar events"
on public.calendar_events for update
to authenticated
using (
  (select private.is_household_member(household_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_household_admin(household_id))
  )
)
with check ((select private.is_household_member(household_id)));

create policy "Members can delete their calendar events"
on public.calendar_events for delete
to authenticated
using (
  (select private.is_household_member(household_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_household_admin(household_id))
  )
);

grant select, insert, delete
on public.calendar_events
to authenticated;

grant update (
  title,
  description,
  location,
  event_date,
  start_time,
  end_time,
  all_day,
  category,
  updated_at
)
on public.calendar_events
to authenticated;
