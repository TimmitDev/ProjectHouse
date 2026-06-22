import { MailCheck } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
        <MailCheck className="size-7" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        Controleer je inbox
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
        We hebben een bevestigingslink verstuurd
        {email ? ` naar ${email}` : ""}. Open deze om verder te gaan met het
        instellen van je huishouden.
      </p>
      <Link
        href="/login"
        className={buttonVariants({
          variant: "secondary",
          className: "mt-7 w-full",
        })}
      >
        Terug naar inloggen
      </Link>
    </div>
  );
}
