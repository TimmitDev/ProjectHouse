import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  PiggyBank,
  Target,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  CreateSavingsPotButton,
  ManageSavingsPotButton,
} from "@/components/finances/savings-pot-actions";
import { Card, PageHeader } from "@/components/ui/card";
import { getSavingsPots, getViewer } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Spaarpotjes" };

export default async function SavingsPotsPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("finances")) redirect("/modules");

  const pots = await getSavingsPots(viewer);
  const { currency, locale } = viewer.profile;
  const totalSaved = pots.reduce(
    (total, pot) => total + pot.currentAmount,
    0,
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financiën"
        title="Spaarpotjes"
        description="Verdeel geld over flexibele potjes en gebruik het weer wanneer dat nodig is."
        actions={<CreateSavingsPotButton />}
      />

      {pots.length ? (
        <>
          <Card className="flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
                <Coins className="size-6" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Verdeeld over alle potjes
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {formatCurrency(totalSaved, currency, locale)}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              {pots.length} {pots.length === 1 ? "actief potje" : "actieve potjes"}
            </p>
          </Card>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pots.map((pot) => {
              const percentage = pot.targetAmount
                ? Math.min(
                    100,
                    Math.round(
                      (pot.currentAmount / pot.targetAmount) * 100,
                    ),
                  )
                : null;

              return (
                <Card
                  key={pot.id}
                  className="group relative flex min-h-[390px] flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ backgroundColor: pot.color }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70"
                    style={{
                      background: `linear-gradient(145deg, ${pot.color}18 0%, transparent 68%)`,
                    }}
                  />

                  <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className="grid size-11 place-items-center rounded-2xl text-white shadow-sm"
                        style={{ backgroundColor: pot.color }}
                      >
                        <PiggyBank className="size-5" />
                      </span>
                      {percentage !== null && (
                        <span className="rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
                          {percentage}% gevuld
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <h2 className="truncate text-lg font-semibold tracking-[-0.025em] text-slate-950">
                        {pot.name}
                      </h2>
                      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
                        {pot.description || "Een flexibel potje voor later."}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-medium text-slate-400">
                        Huidig saldo
                      </p>
                      <p className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-slate-950">
                        {formatCurrency(
                          pot.currentAmount,
                          currency,
                          locale,
                        )}
                      </p>
                    </div>

                    {pot.targetAmount && percentage !== null ? (
                      <div className="mt-5">
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: pot.color,
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Target className="size-3.5" />
                            Doel
                          </span>
                          <span className="font-semibold text-slate-600">
                            {formatCurrency(
                              pot.targetAmount,
                              currency,
                              locale,
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                        Geen vast doelbedrag — dit potje blijft flexibel.
                      </div>
                    )}

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Laatste mutaties
                      </p>
                      {pot.recentEntries.length ? (
                        <div className="mt-2 space-y-2">
                          {pot.recentEntries.slice(0, 2).map((entry) => {
                            const deposit = entry.amount > 0;
                            return (
                              <div
                                key={entry.id}
                                className="flex items-center gap-2.5"
                              >
                                <span
                                  className={cn(
                                    "grid size-7 shrink-0 place-items-center rounded-lg",
                                    deposit
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-orange-50 text-orange-600",
                                  )}
                                >
                                  {deposit ? (
                                    <ArrowDownLeft className="size-3.5" />
                                  ) : (
                                    <ArrowUpRight className="size-3.5" />
                                  )}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-slate-600">
                                    {entry.note ||
                                      (deposit ? "Toegevoegd" : "Opgenomen")}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {formatDate(entry.createdAt, locale)}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "text-xs font-semibold",
                                    deposit
                                      ? "text-emerald-600"
                                      : "text-slate-700",
                                  )}
                                >
                                  {deposit ? "+" : "−"}
                                  {formatCurrency(
                                    Math.abs(entry.amount),
                                    currency,
                                    locale,
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400">
                          Nog geen geld toegevoegd of opgenomen.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative border-t border-slate-100 bg-slate-50/60 p-4">
                    <ManageSavingsPotButton
                      pot={pot}
                      currency={currency}
                      locale={locale}
                    />
                  </div>
                </Card>
              );
            })}
          </section>
        </>
      ) : (
        <Card className="grid min-h-[420px] place-items-center p-8 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
              <PiggyBank className="size-7" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Maak je eerste spaarpotje
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Zet geld apart voor een buffer, vaste kosten of iets leuks en
              neem het weer op wanneer je het nodig hebt.
            </p>
            <div className="mt-5 flex justify-center">
              <CreateSavingsPotButton />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
