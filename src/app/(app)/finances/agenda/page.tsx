import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Repeat2,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddFinancialAgendaItemButton } from "@/components/finances/agenda-form";
import { DeleteFinancialItemButton } from "@/components/finances/delete-financial-item-button";
import { Card, PageHeader } from "@/components/ui/card";
import {
  eachDate,
  expandFinancialAgendaItems,
  getCalendarRange,
  getMonthRange,
  shiftMonth,
} from "@/lib/finance-agenda";
import { getFinancialAgendaData, getViewer } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  FinancialAgendaOccurrence,
  FinancialRecurrence,
} from "@/types/app";

export const metadata: Metadata = { title: "Financiële agenda" };

const recurrenceLabels: Record<FinancialRecurrence, string> = {
  none: "Eenmalig",
  weekly: "Wekelijks",
  monthly: "Maandelijks",
  yearly: "Jaarlijks",
};

const agendaDateFormatters = new Map<string, Intl.DateTimeFormat>();

function formatAgendaDate(value: string, locale: string) {
  let formatter = agendaDateFormatters.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    agendaDateFormatters.set(locale, formatter);
  }

  return formatter.format(new Date(`${value}T00:00:00Z`));
}

function formatBudgetMonth(
  value: string,
  locale: string,
  includeYear = true,
) {
  return new Intl.DateTimeFormat(locale, {
    month: includeYear ? "long" : "short",
    year: includeYear ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
}

function AgendaListItem({
  occurrence,
  currency,
  locale,
  canDelete,
}: {
  occurrence: FinancialAgendaOccurrence;
  currency: string;
  locale: string;
  canDelete: boolean;
}) {
  const income = occurrence.type === "income";

  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          income
            ? "bg-emerald-50 text-emerald-600"
            : "bg-orange-50 text-orange-600",
        )}
      >
        {income ? (
          <ArrowDownLeft className="size-[18px]" />
        ) : (
          <ArrowUpRight className="size-[18px]" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {occurrence.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Betaald {formatAgendaDate(occurrence.occurrenceDate, locale)} ·{" "}
              {occurrence.category}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <p
              className={cn(
                "pt-1 text-sm font-semibold",
                income ? "text-emerald-600" : "text-slate-800",
              )}
            >
              {income ? "+" : "−"}
              {formatCurrency(occurrence.amount, currency, locale)}
            </p>
            {canDelete && (
              <DeleteFinancialItemButton
                id={occurrence.id}
                name={occurrence.title}
                type="agenda"
                recurring={occurrence.recurrence !== "none"}
              />
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
            <UserRound className="size-3" />
            {occurrence.assignedToName}
          </span>
          {occurrence.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
              <Repeat2 className="size-3" />
              {recurrenceLabels[occurrence.recurrence]}
            </span>
          )}
          {occurrence.budgetMonthOffset === 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium capitalize text-emerald-700">
              <CalendarDays className="size-3" />
              Voor {formatBudgetMonth(occurrence.budgetMonth, locale)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function FinancialAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("finances")) redirect("/modules");
  const householdRole = viewer.household.role;

  const params = await searchParams;
  const requestedMonth =
    params.month || new Date().toISOString().slice(0, 7);
  const month = getMonthRange(requestedMonth);
  const calendarRange = getCalendarRange(month.key);
  const previousMonth = getMonthRange(shiftMonth(month.key, -1));
  const agendaRange = {
    start: previousMonth.start,
    end: calendarRange.end,
  };
  const data = await getFinancialAgendaData(viewer, agendaRange);
  const allOccurrences = expandFinancialAgendaItems(
    data.items,
    agendaRange.start,
    agendaRange.end,
  );
  const calendarOccurrences = allOccurrences.filter(
    (occurrence) =>
      occurrence.occurrenceDate >= calendarRange.start &&
      occurrence.occurrenceDate <= calendarRange.end,
  );
  const occurrencesByDate = new Map<
    string,
    FinancialAgendaOccurrence[]
  >();
  for (const occurrence of calendarOccurrences) {
    const dayOccurrences =
      occurrencesByDate.get(occurrence.occurrenceDate) ?? [];
    dayOccurrences.push(occurrence);
    occurrencesByDate.set(occurrence.occurrenceDate, dayOccurrences);
  }
  const monthOccurrences = allOccurrences.filter(
    (occurrence) => occurrence.budgetMonth === month.key,
  );
  const calendarDates = eachDate(calendarRange.start, calendarRange.end);
  const { currency, locale } = viewer.profile;
  const plannedIncome = monthOccurrences
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);
  const plannedExpenses = monthOccurrences
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);
  const recurringCount = new Set(
    monthOccurrences
      .filter((item) => item.recurrence !== "none")
      .map((item) => item.id),
  ).size;
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(month.date);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financiën"
        title="Financiële agenda"
        description="Plan inkomsten en uitgaven vooruit, wijs ze toe en houd terugkerende bedragen overzichtelijk."
        actions={
          <AddFinancialAgendaItemButton
            members={data.members}
            viewerId={viewer.profile.id}
          />
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Geplande inkomsten",
            value: plannedIncome,
            className: "text-emerald-600",
          },
          {
            label: "Geplande uitgaven",
            value: plannedExpenses,
            className: "text-slate-950",
          },
          {
            label: "Verwacht verschil",
            value: plannedIncome - plannedExpenses,
            className:
              plannedIncome - plannedExpenses >= 0
                ? "text-emerald-600"
                : "text-orange-600",
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-400">{stat.label}</p>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold tracking-[-0.035em]",
                stat.className,
              )}
            >
              {formatCurrency(stat.value, currency, locale)}
            </p>
            <p className="mt-1 text-xs capitalize text-slate-400">
              {monthLabel}
            </p>
          </Card>
        ))}
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-400">
            Terugkerende posten
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
            {recurringCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Actief in deze maand</p>
        </Card>
      </section>

      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="font-semibold capitalize tracking-[-0.02em] text-slate-900">
                {monthLabel}
              </h2>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
                Alle geplande bedragen per dag
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                href={`/finances/agenda?month=${shiftMonth(month.key, -1)}`}
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Vorige maand"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <Link
                href="/finances/agenda"
                className="hidden h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
              >
                Vandaag
              </Link>
              <Link
                href={`/finances/agenda?month=${shiftMonth(month.key, 1)}`}
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Volgende maand"
              >
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
              <div
                key={day}
                className="min-w-0 px-0.5 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400 sm:px-3 sm:text-[11px] sm:tracking-[0.08em]"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDates.map((date, index) => {
              const dayOccurrences = occurrencesByDate.get(date) ?? [];
              const inMonth = date.startsWith(month.key);
              const isToday = date === today;

              return (
                <div
                  key={date}
                  className={cn(
                    "min-h-[72px] min-w-0 border-b border-r border-slate-100 p-1 sm:min-h-28 sm:p-2 lg:p-2.5",
                    index % 7 === 6 && "border-r-0",
                    !inMonth && "bg-slate-50/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-[11px] font-medium sm:size-7 sm:text-xs",
                      inMonth ? "text-slate-600" : "text-slate-300",
                      isToday &&
                        "bg-[var(--accent)] font-semibold text-white",
                    )}
                  >
                    {Number(date.slice(-2))}
                  </span>

                  <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                    {dayOccurrences.slice(0, 4).map((occurrence) => (
                      <span
                        key={`${occurrence.id}-${date}`}
                        className={cn(
                          "size-1.5 rounded-full",
                          occurrence.type === "income"
                            ? "bg-emerald-500"
                            : "bg-orange-400",
                        )}
                        title={`${occurrence.title} · ${formatCurrency(
                          occurrence.amount,
                          currency,
                          locale,
                        )}${
                          occurrence.budgetMonthOffset === 1
                            ? ` · voor ${formatBudgetMonth(
                                occurrence.budgetMonth,
                                locale,
                              )}`
                            : ""
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-1.5 hidden min-w-0 space-y-1 sm:block">
                    {dayOccurrences.slice(0, 3).map((occurrence) => (
                      <div
                        key={`${occurrence.id}-${date}`}
                        className={cn(
                          "min-w-0 rounded-md px-1.5 py-1 text-[10px] leading-4 lg:px-2",
                          occurrence.type === "income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-orange-50 text-orange-700",
                        )}
                        title={`${occurrence.title} · ${occurrence.assignedToName}`}
                      >
                        <p className="truncate font-semibold">
                          {occurrence.title}
                        </p>
                        <p className="hidden truncate opacity-80 md:block">
                          {formatCurrency(
                            occurrence.amount,
                            currency,
                            locale,
                          )}
                        </p>
                        {occurrence.budgetMonthOffset === 1 && (
                          <p className="hidden truncate opacity-70 lg:block">
                            voor{" "}
                            {formatBudgetMonth(
                              occurrence.budgetMonth,
                              locale,
                              false,
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                    {dayOccurrences.length > 3 && (
                      <p className="truncate px-1 text-[10px] font-medium text-slate-400">
                        +{dayOccurrences.length - 3} meer
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="min-w-0 self-start p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
                Posten deze maand
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Inclusief verantwoordelijke
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-400">
              <CalendarDays className="size-4" />
            </span>
          </div>

          {monthOccurrences.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {monthOccurrences.map((occurrence) => (
                <AgendaListItem
                  key={`${occurrence.id}-${occurrence.occurrenceDate}`}
                  occurrence={occurrence}
                  currency={currency}
                  locale={locale}
                  canDelete={
                    occurrence.createdBy === viewer.profile.id ||
                    householdRole !== "member"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-300">
                  <CalendarDays className="size-6" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Nog niets gepland
                </p>
                <p className="mt-1 max-w-56 text-xs leading-5 text-slate-400">
                  Voeg een bedrag toe om deze maand vooruit te plannen.
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
