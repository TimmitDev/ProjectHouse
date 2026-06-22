import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { startDemoAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/data";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect(viewer.household ? "/dashboard" : "/onboarding");
  }

  return (
    <>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-black">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sign in to continue to Nestly.
        </p>
      </div>
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
              View sample household
            </Button>
          </form>
        </>
      )}
    </>
  );
}
