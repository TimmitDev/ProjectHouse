import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { HouseholdForm } from "@/components/onboarding/household-form";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Set up your household" };

export default async function OnboardingPage() {
  const viewer = await getViewer();

  if (!viewer) redirect("/login");
  if (viewer.household) redirect("/dashboard");

  return (
    <div
      className="min-h-screen bg-[#f7f8f6] px-4 py-6 sm:px-6 sm:py-10"
      style={{ "--accent": viewer.profile.accentColor } as React.CSSProperties}
    >
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <Logo href="/onboarding" />
          <p className="hidden text-sm text-slate-500 sm:block">
            Signed in as{" "}
            <span className="font-medium text-slate-700">
              {viewer.profile.email}
            </span>
          </p>
        </header>

        <main className="mx-auto mt-12 max-w-xl sm:mt-16">
          <OnboardingStepper currentStep={2} />
          <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-medium text-[var(--accent)]">
                Step 2 of 3
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950">
                Bring your household together
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start a new household or join one with an invite code.
              </p>
            </div>
            <HouseholdForm />
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">
            You can invite more members from your dashboard at any time.
          </p>
        </main>
      </div>
    </div>
  );
}
