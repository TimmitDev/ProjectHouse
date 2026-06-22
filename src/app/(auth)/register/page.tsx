import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/brand/logo";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect(viewer.household ? "/dashboard" : "/onboarding");
  }

  return (
    <>
      <div className="mb-8 lg:hidden">
        <Logo href="/login" />
      </div>
      <OnboardingStepper currentStep={1} />
      <div className="mb-7 mt-9">
        <p className="text-sm font-medium text-[var(--accent)]">Step 1 of 3</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950">
          Create your account
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          You will set up or join your household next.
        </p>
      </div>
      <AuthForm mode="register" />
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        By creating an account, you agree to keep shared household data
        respectful and accurate.
      </p>
    </>
  );
}
