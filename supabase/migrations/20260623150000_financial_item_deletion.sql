drop policy if exists "Admins can delete savings goals"
on public.savings_goals;

create policy "Creators and admins can delete savings goals"
on public.savings_goals for delete
to authenticated
using (
  (select private.is_household_member(household_id))
  and (
    created_by = (select auth.uid())
    or (select private.is_household_admin(household_id))
  )
);
