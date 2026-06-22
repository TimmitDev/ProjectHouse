import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { startDemoAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";
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
      <div className="mb-10 lg:hidden">
        <Logo href="/login" />
      </div>
      <div className="mb-7">
        <p className="text-sm font-medium text-[var(--accent)]">
          Welcome back
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950">
          Sign in to your home
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Pick up where your household left off.
        </p>
      </div>
      <AuthForm mode="login" />
      {isDemoMode && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <form action={startDemoAction}>
            <Button type="submit" variant="secondary" className="w-full">
              Explore the sample household
            </Button>
          </form>
        </>
      )}
    </>
  );
}
