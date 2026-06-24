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
  current_day date := timezone('Europe/Amsterdam', now())::date;
  calendar_month_start date := make_date(
    extract(year from current_day)::int,
    extract(month from current_day)::int,
    24
  );
  budget_start date := case
    when extract(day from current_day)::int >= 24 then calendar_month_start
    else (calendar_month_start - interval '1 month')::date
  end;
  budget_end_exclusive date := (budget_start + interval '1 month')::date;
  budget_end date := (budget_end_exclusive - interval '1 day')::date;
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
          and t.transaction_date >= budget_start
          and t.transaction_date < budget_end_exclusive
      ),
      0
    ),
    coalesce(
      sum(t.amount) filter (
        where t.type = 'expense'
          and t.transaction_date >= budget_start
          and t.transaction_date < budget_end_exclusive
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
    'budget_start', budget_start,
    'budget_end', budget_end,
    'budget_key', to_char(budget_start, 'YYYY-MM'),
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
              'icon', g.icon,
              'created_by', g.created_by
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

update public.financial_agenda_items
set budget_month_offset = 0,
    updated_at = now()
where type = 'income'
  and budget_month_offset = 1
  and extract(day from due_date)::int >= 24;
