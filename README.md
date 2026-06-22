# Nestly

A clean household app built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Included

- Email/password authentication with server-side Supabase sessions
- Three-step registration and household onboarding
- Create a household or join with a private invite code
- Responsive dashboard and mobile/desktop sidebar
- Modular household features
- Shared finance overview and transactions
- Shared savings goals with atomic contributions
- Account, locale, currency and theme-color settings
- PostgreSQL Row Level Security for household data
- Built-in local demo mode

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`.

3. Add your Supabase project URL and publishable key. For a UI-only local demo:

   ```env
   NEXT_PUBLIC_DEMO_MODE=true
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## Supabase setup

Create a Supabase project and run:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternatively, paste
`supabase/migrations/20260622000000_initial_schema.sql` into the Supabase SQL
Editor.

In Supabase Authentication settings:

- Set the Site URL to your production domain.
- Add `http://localhost:3000/auth/confirm` for local development.
- Add `https://your-domain.com/auth/confirm` for production.
- Keep leaked-password protection and email confirmation enabled for production.

## Vercel deployment

Import the repository into Vercel and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_DEMO_MODE=false
```

No custom Vercel build configuration is required. Vercel will run `next build`.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

Never expose a Supabase secret or service-role key through a `NEXT_PUBLIC_`
environment variable. The app only needs the publishable key; authorization is
enforced by the included RLS policies.
