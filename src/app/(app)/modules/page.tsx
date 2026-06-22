import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ModuleCard } from "@/components/modules/module-card";
import { PageHeader } from "@/components/ui/card";
import { getViewer } from "@/lib/data";
import { moduleCatalog } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Modules" };

export default async function ModulesPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  const canManage = viewer.household.role !== "member";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Customize"
        title="Modules"
        description="Keep your home simple. Activate only the tools your household wants to use."
      />

      {!canManage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You can explore modules here. A household owner or admin controls
          which ones are active.
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {moduleCatalog.map((module) => (
          <ModuleCard
            key={module.key}
            module={module}
            enabled={viewer.enabledModules.includes(module.key)}
            canManage={canManage}
          />
        ))}
      </section>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          More useful modules are on the way.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          The modular structure is ready for calendars, chores and groceries.
        </p>
      </div>
    </div>
  );
}
