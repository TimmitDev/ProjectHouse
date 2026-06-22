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
    (new_household_id, 'groceries', false);

  return new_household_id;
end;
$$;

grant execute
on function public.create_additional_household(text, text)
to authenticated;
