import { Flag, Target } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GoalProgress } from "@/components/dashboard/widgets";
import {
  ContributeButton,
  CreateGoalButton,
} from "@/components/finances/goal-actions";
import { Card, PageHeader } from "@/components/ui/card";
import { getSavingsGoalsData, getViewer } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Spaardoelen" };

export default async function SavingsGoalsPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("finances")) redirect("/modules");
  const goals = await getSavingsGoalsData(viewer);
  const { currency, locale } = viewer.profile;
  const totalSaved = goals.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  );
  const totalTarget = goals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financiën"
        title="Spaardoelen"
        description="Maak gezamenlijke plannen zichtbaar, bijdrage voor bijdrage."
        actions={<CreateGoalButton />}
      />

      <Card className="overflow-hidden">
        <div className="grid gap-0 sm:grid-cols-3">
          <div className="border-b border-slate-100 p-5 sm:border-b-0 sm:border-r sm:p-6">
            <p className="text-xs font-medium text-slate-400">Totaal gespaard</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
              {formatCurrency(totalSaved, currency, locale)}
            </p>
          </div>
          <div className="border-b border-slate-100 p-5 sm:border-b-0 sm:border-r sm:p-6">
            <p className="text-xs font-medium text-slate-400">Gezamenlijk doelbedrag</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
              {formatCurrency(totalTarget, currency, locale)}
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-xs font-medium text-slate-400">Actieve doelen</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
              {goals.length}
            </p>
          </div>
        </div>
      </Card>

      {goals.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const complete = goal.currentAmount >= goal.targetAmount;
            return (
              <Card key={goal.id} className="flex min-h-72 flex-col p-5">
                <div className="flex items-start justify-between">
                  <span
                    className="grid size-11 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: goal.color }}
                  >
                    {complete ? (
                      <Flag className="size-5" />
                    ) : (
                      <Target className="size-5" />
                    )}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {complete ? "Behaald" : "Bezig"}
                  </span>
                </div>
                <div className="mt-5">
                  <GoalProgress
                    goal={goal}
                    currency={currency}
                    locale={locale}
                  />
                </div>
                <div className="mt-auto pt-6">
                  <ContributeButton goalId={goal.id} goalName={goal.name} />
                </div>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="grid min-h-[420px] place-items-center p-8 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_9%,white)] text-[var(--accent)]">
              <Target className="size-7" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Je eerste doel begint hier
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Of het nu om een financiële buffer of een groot avontuur gaat:
              maak het plan zichtbaar voor iedereen.
            </p>
            <div className="mt-5 flex justify-center">
              <CreateGoalButton />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
