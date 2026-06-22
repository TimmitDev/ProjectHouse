update public.profiles
set
  locale = 'nl-NL',
  updated_at = now()
where locale = 'en-US';

alter table public.profiles
  alter column locale set default 'nl-NL';
