import {
  CalendarDays,
  CheckCircle2,
  Flag,
  PiggyBank,
  Target,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  ContributeButton,
  CreateGoalButton,
} from "@/components/finances/goal-actions";
import { Card, PageHeader } from "@/components/ui/card";
import { getSavingsGoalsData, getViewer } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Spaardoelen" };

function getDeadlineLabel(deadline: string | null) {
  if (!deadline) return null;

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const deadlineUtc = new Date(`${deadline}T00:00:00Z`).getTime();
  const daysRemaining = Math.ceil(
    (deadlineUtc - todayUtc) / (24 * 60 * 60 * 1000),
  );

  if (daysRemaining < 0) return "Streefdatum verstreken";
  if (daysRemaining === 0) return "Streefdatum vandaag";
  if (daysRemaining === 1) return "Nog 1 dag";
  return `Nog ${daysRemaining} dagen`;
}

export default async function SavingsGoalsPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("finances")) redirect("/modules");
  const goals = await getSavingsGoalsData(viewer);
  const { currency, locale } = viewer.profile;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financiën"
        title="Spaardoelen"
        description="Maak gezamenlijke plannen zichtbaar, bijdrage voor bijdrage."
        actions={<CreateGoalButton />}
      />

      {goals.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const complete = goal.currentAmount >= goal.targetAmount;
            const percentage = Math.min(
              100,
              Math.round((goal.currentAmount / goal.targetAmount) * 100),
            );
            const remaining = Math.max(
              0,
              goal.targetAmount - goal.currentAmount,
            );
            const deadlineLabel = getDeadlineLabel(goal.deadline);

            return (
              <Card
                key={goal.id}
                className="group relative flex min-h-[360px] flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: goal.color }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70"
                  style={{
                    background: `linear-gradient(145deg, ${goal.color}18 0%, transparent 68%)`,
                  }}
                />

                <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
                      style={{ backgroundColor: goal.color }}
                    >
                      {complete ? (
                        <Flag className="size-5" />
                      ) : (
                        <Target className="size-5" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        complete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-white/80 bg-white/75 text-slate-600 shadow-sm backdrop-blur-sm",
                      )}
                    >
                      {complete && <CheckCircle2 className="size-3.5" />}
                      {complete ? "Doel behaald" : `${percentage}% voltooid`}
                    </span>
                  </div>

                  <div className="mt-6">
                    <h2 className="truncate text-lg font-semibold tracking-[-0.025em] text-slate-950">
                      {goal.name}
                    </h2>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Gespaard
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                          {formatCurrency(
                            goal.currentAmount,
                            currency,
                            locale,
                          )}
                        </p>
                      </div>
                      <p className="pb-0.5 text-right text-xs text-slate-400">
                        van{" "}
                        <span className="font-semibold text-slate-600">
                          {formatCurrency(
                            goal.targetAmount,
                            currency,
                            locale,
                          )}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <PiggyBank className="size-3.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
                          {complete ? "Resultaat" : "Nog nodig"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {complete
                          ? "Volledig gespaard"
                          : formatCurrency(remaining, currency, locale)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <CalendarDays className="size-3.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">
                          Streefdatum
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {goal.deadline
                          ? formatDate(goal.deadline, locale)
                          : "Geen datum"}
                      </p>
                    </div>
                  </div>

                  {deadlineLabel && !complete && (
                    <p className="mt-3 text-xs text-slate-400">
                      {deadlineLabel}
                    </p>
                  )}
                </div>

                <div className="relative border-t border-slate-100 bg-slate-50/60 p-4">
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
