# Nestly

Een overzichtelijke huishoudapp gebouwd met Next.js, TypeScript, Tailwind CSS
en Supabase.

## Inbegrepen

- Authenticatie met e-mailadres en wachtwoord via server-side Supabase-sessies
- Registratie en huishoudinstelling in drie stappen
- Een huishouden aanmaken of deelnemen met een privé-uitnodigingscode
- Responsief dashboard met een sidebar voor mobiel en desktop
- Modulaire functies voor het huishouden
- Gedeeld financieel overzicht en transacties
- Financiële agenda met toegewezen en terugkerende inkomsten en uitgaven
- Gedeelde spaardoelen met atomaire bijdragen
- Een gezamenlijke boodschappenlijst met categorieën en afvinkstatus
- Wisselen tussen meerdere huishoudens en extra huishoudens aanmaken
- Instellingen voor account, regio, valuta en themakleur
- PostgreSQL Row Level Security voor huishoudgegevens
- Ingebouwde lokale demomodus

## Lokale ontwikkeling

1. Installeer de afhankelijkheden:

   ```bash
   npm install
   ```

2. Kopieer `.env.example` naar `.env.local`.

3. Voeg de project-URL en publishable key van Supabase toe. Gebruik voor een
   lokale UI-demo zonder database:

   ```env
   NEXT_PUBLIC_DEMO_MODE=true
   ```

4. Start de app:

   ```bash
   npm run dev
   ```

## Supabase instellen

Maak een Supabase-project aan en voer het volgende uit:

```bash
supabase link --project-ref JOUW_PROJECT_REF
supabase db push
```

Je kunt de migraties in `supabase/migrations` ook uitvoeren via de SQL Editor
van Supabase.

Stel bij Supabase Authentication het volgende in:

- Stel de Site URL in op je productiedomein.
- Voeg `http://localhost:3000/auth/confirm` toe voor lokale ontwikkeling.
- Voeg `https://jouw-domein.nl/auth/confirm` toe voor productie.
- Laat bescherming tegen gelekte wachtwoorden en e-mailbevestiging ingeschakeld.

## Publiceren op Vercel

Importeer de repository in Vercel en configureer:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_jouw-key
NEXT_PUBLIC_SITE_URL=https://jouw-domein.nl
NEXT_PUBLIC_DEMO_MODE=false
```

Er is geen aangepaste Vercel-buildconfiguratie nodig. Vercel voert automatisch
`next build` uit.

## Controle

```bash
npm run lint
npm run typecheck
npm run build
```

Plaats nooit een Supabase secret key of service-role key in een
`NEXT_PUBLIC_`-omgevingsvariabele. De app heeft alleen de publishable key nodig;
toegang wordt beveiligd door de meegeleverde RLS-regels.
