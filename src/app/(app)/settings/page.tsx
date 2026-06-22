import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { Card, PageHeader } from "@/components/ui/card";
import { getViewer } from "@/lib/data";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = { title: "Account en thema" };

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Persoonlijk"
        title="Account en thema"
        description="Beheer alleen je persoonlijke profiel, regionale voorkeuren en de uitstraling van je app."
      />

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="grid size-14 place-items-center rounded-2xl bg-[var(--accent)] text-sm font-semibold text-white">
              {getInitials(viewer.profile.fullName)}
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">
              {viewer.profile.fullName}
            </h2>
            <p className="mt-1 truncate text-xs text-slate-400">
              {viewer.profile.email}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Account beveiligd
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  De authenticatie wordt veilig beheerd via Supabase.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5 sm:p-7">
          <div className="mb-7">
            <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
              Account en weergave
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Deze voorkeuren gelden voor jouw persoonlijke weergave.
            </p>
          </div>
          <SettingsForm profile={viewer.profile} />
        </Card>
      </div>
    </div>
  );
}
