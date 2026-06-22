create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  household_record record;
  replacement_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authenticatie vereist';
  end if;

  for household_record in
    select distinct h.id, h.created_by
    from public.households h
    left join public.household_members hm on hm.household_id = h.id
    where h.created_by = current_user_id
       or hm.user_id = current_user_id
  loop
    replacement_user_id := null;

    select member.user_id
    into replacement_user_id
    from public.household_members member
    where member.household_id = household_record.id
      and member.user_id <> current_user_id
    order by
      case member.role
        when 'owner' then 0
        when 'admin' then 1
        else 2
      end,
      member.joined_at
    limit 1;

    if replacement_user_id is null then
      delete from public.households
      where id = household_record.id;
    else
      update public.savings_goals
      set created_by = replacement_user_id
      where household_id = household_record.id
        and created_by = current_user_id;

      update public.transactions
      set created_by = replacement_user_id
      where household_id = household_record.id
        and created_by = current_user_id;

      update public.financial_agenda_items
      set created_by = replacement_user_id
      where household_id = household_record.id
        and created_by = current_user_id;

      update public.financial_agenda_items
      set assigned_to = replacement_user_id
      where household_id = household_record.id
        and assigned_to = current_user_id;

      if household_record.created_by = current_user_id then
        update public.households
        set
          created_by = replacement_user_id,
          updated_at = now()
        where id = household_record.id;

        update public.household_members
        set role = 'owner'
        where household_id = household_record.id
          and user_id = replacement_user_id;
      end if;

      delete from public.household_members
      where household_id = household_record.id
        and user_id = current_user_id;
    end if;
  end loop;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
