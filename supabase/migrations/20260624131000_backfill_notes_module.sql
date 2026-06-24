insert into public.household_modules (household_id, module_key, enabled)
select h.id, 'notes'::public.module_key, false
from public.households h
on conflict (household_id, module_key) do nothing;
