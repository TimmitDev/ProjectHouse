import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Wachtwoord herstellen" };

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-black">
          Kies een nieuw wachtwoord
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Stel een nieuw, uniek wachtwoord in voor je Nestly-account.
        </p>
      </div>
      <ResetPasswordForm />
    </>
  );
}
