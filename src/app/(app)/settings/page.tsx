import { ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings/settings-form";
import { Card, PageHeader } from "@/components/ui/card";
import { getViewer } from "@/lib/data";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your account, regional preferences and the color of your workspace."
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
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
              <UserRound className="size-4 text-slate-400" />
              <span className="text-xs font-medium capitalize text-slate-600">
                {viewer.household.role} of {viewer.household.name}
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Account protected
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Authentication is managed securely through Supabase.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5 sm:p-7">
          <div className="mb-7">
            <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
              Account & appearance
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              These preferences apply to your personal view.
            </p>
          </div>
          <SettingsForm profile={viewer.profile} />
        </Card>
      </div>
    </div>
  );
}
