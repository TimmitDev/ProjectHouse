import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { startDemoAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/data";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Inloggen" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (viewer) {
    redirect(viewer.household ? "/dashboard" : "/onboarding");
  }

  return (
    <>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-black">
          Welkom terug
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Log in om verder te gaan naar Nestly.
        </p>
      </div>
      {params.account === "deleted" && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700"
        >
          Je account is definitief verwijderd.
        </div>
      )}
      <AuthForm mode="login" />
      {isDemoMode && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              Demo
            </span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <form action={startDemoAction}>
            <Button
              type="submit"
              variant="secondary"
              className="w-full border-zinc-300 text-black hover:bg-zinc-50"
            >
              Voorbeeldhuishouden bekijken
            </Button>
          </form>
        </>
      )}
    </>
  );
}
