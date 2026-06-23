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
  const sortedModules = [...moduleCatalog].sort(
    (left, right) => Number(right.available) - Number(left.available),
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Aanpassen"
        title="Modules"
        description="Houd het eenvoudig. Activeer alleen de hulpmiddelen die je huishouden wil gebruiken."
      />

      {!canManage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Je kunt de modules hier bekijken. Een eigenaar of beheerder bepaalt
          welke modules actief zijn.
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {sortedModules.map((module) => (
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
          Er komen meer handige modules aan.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          De structuur is klaar voor agenda’s, huishoudelijke taken en meer.
        </p>
      </div>
    </div>
  );
}
