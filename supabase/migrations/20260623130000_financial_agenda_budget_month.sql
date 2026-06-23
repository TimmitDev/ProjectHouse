alter table public.financial_agenda_items
add column budget_month_offset smallint not null default 0
check (budget_month_offset in (0, 1));

create or replace function public.get_financial_agenda_context(
  target_household_id uuid,
  range_start date default null,
  range_end date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authenticatie vereist';
  end if;

  if not exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = current_user_id
  ) then
    raise exception 'Geen toegang tot dit huishouden';
  end if;

  return jsonb_build_object(
    'items',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', i.id,
            'title', i.title,
            'category', i.category,
            'amount', i.amount,
            'type', i.type,
            'due_date', i.due_date,
            'recurrence', i.recurrence,
            'budget_month_offset', i.budget_month_offset,
            'assigned_to', i.assigned_to,
            'assigned_to_name',
              coalesce(nullif(p.full_name, ''), 'Huishoudlid'),
            'created_by', i.created_by
          )
          order by i.due_date
        )
        from public.financial_agenda_items i
        left join public.profiles p on p.id = i.assigned_to
        where i.household_id = target_household_id
          and (range_end is null or i.due_date <= range_end)
          and (
            i.recurrence <> 'none'
            or range_start is null
            or i.due_date >= range_start
          )
      ),
      '[]'::jsonb
    ),
    'members',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', hm.user_id,
            'name', coalesce(nullif(p.full_name, ''), 'Huishoudlid'),
            'role', hm.role
          )
          order by hm.joined_at
        )
        from public.household_members hm
        left join public.profiles p on p.id = hm.user_id
        where hm.household_id = target_household_id
      ),
      '[]'::jsonb
    )
  );
end;
$$;
