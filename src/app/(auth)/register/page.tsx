import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Account aanmaken" };

export default async function RegisterPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect(viewer.household ? "/dashboard" : "/onboarding");
  }

  return (
    <>
      <OnboardingStepper currentStep={1} monochrome />
      <div className="mb-7 mt-8 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-black">
          Account aanmaken
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Start je huishouden in een paar stappen.
        </p>
      </div>
      <AuthForm mode="register" />
    </>
  );
}
