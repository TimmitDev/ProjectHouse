create index if not exists transactions_household_type_date_amount_idx
  on public.transactions(household_id, type, transaction_date)
  include (amount);

create index if not exists savings_goals_household_created_idx
  on public.savings_goals(household_id, created_at desc);

create or replace function public.get_viewer_context(
  requested_household_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_household_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticatie vereist';
  end if;

  select hm.household_id
  into selected_household_id
  from public.household_members hm
  where hm.user_id = current_user_id
    and (
      requested_household_id is null
      or hm.household_id = requested_household_id
    )
  order by
    case when hm.household_id = requested_household_id then 0 else 1 end,
    hm.joined_at
  limit 1;

  if selected_household_id is null and requested_household_id is not null then
    select hm.household_id
    into selected_household_id
    from public.household_members hm
    where hm.user_id = current_user_id
    order by hm.joined_at
    limit 1;
  end if;

  return jsonb_build_object(
    'profile',
    coalesce(
      (
        select jsonb_build_object(
          'full_name', p.full_name,
          'locale', p.locale,
          'currency', p.currency,
          'accent_color', p.accent_color
        )
        from public.profiles p
        where p.id = current_user_id
      ),
      '{}'::jsonb
    ),
    'households',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', h.id,
            'name', h.name,
            'invite_code', h.invite_code,
            'currency', h.currency,
            'role', hm.role
          )
          order by hm.joined_at
        )
        from public.household_members hm
        join public.households h on h.id = hm.household_id
        where hm.user_id = current_user_id
      ),
      '[]'::jsonb
    ),
    'active_household_id',
    selected_household_id,
    'enabled_modules',
    coalesce(
      (
        select jsonb_agg(m.module_key order by m.module_key)
        from public.household_modules m
        where m.household_id = selected_household_id
          and m.enabled = true
      ),
      '[]'::jsonb
    )
  );
end;
$$;

create or replace function public.get_household_dashboard(
  target_household_id uuid,
  include_goals boolean default true,
  include_members boolean default true
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  month_start date := date_trunc('month', timezone('utc', now()))::date;
  total_income numeric := 0;
  total_expenses numeric := 0;
  monthly_income numeric := 0;
  monthly_expenses numeric := 0;
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

  select
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0),
    coalesce(
      sum(t.amount) filter (
        where t.type = 'income'
          and t.transaction_date >= month_start
      ),
      0
    ),
    coalesce(
      sum(t.amount) filter (
        where t.type = 'expense'
          and t.transaction_date >= month_start
      ),
      0
    )
  into total_income, total_expenses, monthly_income, monthly_expenses
  from public.transactions t
  where t.household_id = target_household_id;

  return jsonb_build_object(
    'total_income', total_income,
    'total_expenses', total_expenses,
    'monthly_income', monthly_income,
    'monthly_expenses', monthly_expenses,
    'transactions',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', recent.id,
            'description', recent.description,
            'category', recent.category,
            'amount', recent.amount,
            'transaction_date', recent.transaction_date,
            'type', recent.type
          )
          order by recent.transaction_date desc, recent.created_at desc
        )
        from (
          select
            t.id,
            t.description,
            t.category,
            t.amount,
            t.transaction_date,
            t.type,
            t.created_at
          from public.transactions t
          where t.household_id = target_household_id
          order by t.transaction_date desc, t.created_at desc
          limit 8
        ) recent
      ),
      '[]'::jsonb
    ),
    'goals',
    case
      when include_goals then coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', g.id,
              'name', g.name,
              'target_amount', g.target_amount,
              'current_amount', g.current_amount,
              'deadline', g.deadline,
              'color', g.color,
              'icon', g.icon
            )
            order by g.created_at desc
          )
          from public.savings_goals g
          where g.household_id = target_household_id
        ),
        '[]'::jsonb
      )
      else '[]'::jsonb
    end,
    'members',
    case
      when include_members then coalesce(
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
      else '[]'::jsonb
    end
  );
end;
$$;

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

revoke all on function public.get_viewer_context(uuid) from public;
revoke all on function public.get_household_dashboard(uuid, boolean, boolean) from public;
revoke all on function public.get_financial_agenda_context(uuid, date, date) from public;

grant execute on function public.get_viewer_context(uuid) to authenticated;
grant execute on function public.get_household_dashboard(uuid, boolean, boolean)
  to authenticated;
grant execute on function public.get_financial_agenda_context(uuid, date, date)
  to authenticated;
