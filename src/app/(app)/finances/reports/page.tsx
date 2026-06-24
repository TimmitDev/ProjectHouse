import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ReceiptText,
  Repeat2,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddFinancialAgendaItemButton } from "@/components/finances/agenda-form";
import { Card, PageHeader } from "@/components/ui/card";
import {
  formatBudgetPeriod,
  getCurrentBudgetMonthKey,
} from "@/lib/budget-period";
import { getFinancialAgendaData, getViewer } from "@/lib/data";
import {
  expandFinancialAgendaItems,
  getMonthRange,
  shiftMonth,
} from "@/lib/finance-agenda";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  FinancialAgendaOccurrence,
  FinancialRecurrence,
} from "@/types/app";

export const metadata: Metadata = { title: "Rapporten" };

const recurrenceLabels: Record<FinancialRecurrence, string> = {
  none: "Eenmalig",
  weekly: "Wekelijks",
  monthly: "Maandelijks",
  yearly: "Jaarlijks",
};

type FixedCost = {
  id: string;
  title: string;
  category: string;
  assignedToName: string;
  recurrence: FinancialRecurrence;
  amount: number;
  total: number;
  count: number;
  firstDate: string;
  lastDate: string;
};

type BreakdownItem = {
  label: string;
  total: number;
  count: number;
};

function groupFixedCosts(occurrences: FinancialAgendaOccurrence[]) {
  const grouped = new Map<string, FixedCost>();

  for (const occurrence of occurrences) {
    const existing = grouped.get(occurrence.id);

    if (existing) {
      existing.total += occurrence.amount;
      existing.count += 1;
      existing.lastDate = occurrence.occurrenceDate;
      continue;
    }

    grouped.set(occurrence.id, {
      id: occurrence.id,
      title: occurrence.title,
      category: occurrence.category,
      assignedToName: occurrence.assignedToName,
      recurrence: occurrence.recurrence,
      amount: occurrence.amount,
      total: occurrence.amount,
      count: 1,
      firstDate: occurrence.occurrenceDate,
      lastDate: occurrence.occurrenceDate,
    });
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.total - a.total || a.title.localeCompare(b.title),
  );
}

function buildBreakdown(
  costs: FixedCost[],
  getLabel: (cost: FixedCost) => string,
) {
  const grouped = new Map<string, BreakdownItem>();

  for (const cost of costs) {
    const label = getLabel(cost);
    const existing = grouped.get(label);

    if (existing) {
      existing.total += cost.total;
      existing.count += cost.count;
    } else {
      grouped.set(label, {
        label,
        total: cost.total,
        count: cost.count,
      });
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.total - a.total || a.label.localeCompare(b.label),
  );
}

function StatBlock({
  label,
  value,
  meta,
  icon: Icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof ReceiptText;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-5 text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{meta}</p>
    </Card>
  );
}

function BreakdownList({
  title,
  description,
  items,
  total,
  currency,
  locale,
}: {
  title: string;
  description: string;
  items: BreakdownItem[];
  total: number;
  currency: string;
  locale: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>

      {items.length ? (
        <div className="space-y-4">
          {items.map((item) => {
            const percentage =
              total > 0 ? Math.round((item.total / total) * 100) : 0;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-600">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {item.count} {item.count === 1 ? "betaling" : "betalingen"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(item.total, currency, locale)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {percentage}%
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState compact />
      )}
    </Card>
  );
}

function FixedCostRow({
  cost,
  currency,
  locale,
}: {
  cost: FixedCost;
  currency: string;
  locale: string;
}) {
  return (
    <div className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_170px_150px] sm:items-center">
      <div className="flex min-w-0 gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
          <ReceiptText className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {cost.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {cost.category} - eerstvolgend {formatDate(cost.firstDate, locale)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
              <UserRound className="size-3" />
              {cost.assignedToName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
              <Repeat2 className="size-3" />
              {recurrenceLabels[cost.recurrence]}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
        <p className="text-[11px] font-medium text-slate-400 sm:hidden">
          Bedrag
        </p>
        <p className="text-sm font-semibold text-slate-700">
          {formatCurrency(cost.amount, currency, locale)}
        </p>
        {cost.count > 1 && (
          <p className="mt-0.5 text-xs text-slate-400">
            {cost.count} keer deze maand
          </p>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2 text-left sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
        <p className="text-[11px] font-medium text-slate-400 sm:hidden">
          Totaal
        </p>
        <p className="text-sm font-semibold text-slate-950">
          {formatCurrency(cost.total, currency, locale)}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-xl border border-dashed border-slate-200 text-center",
        compact ? "min-h-40" : "min-h-72",
      )}
    >
      <div>
        <ReceiptText className="mx-auto size-6 text-slate-300" />
        <p className="mt-2 text-sm font-medium text-slate-600">
          Geen vaste lasten gevonden
        </p>
        <p className="mt-1 max-w-64 text-xs leading-5 text-slate-400">
          Voeg terugkerende uitgaven toe aan de financiele agenda om ze hier te
          volgen.
        </p>
      </div>
    </div>
  );
}

export default async function FinanceReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("finances")) redirect("/modules");

  const params = await searchParams;
  const requestedMonth = params.month || getCurrentBudgetMonthKey();
  const month = getMonthRange(requestedMonth);
  const data = await getFinancialAgendaData(viewer, {
    start: month.start,
    end: month.end,
  });
  const monthOccurrences = expandFinancialAgendaItems(
    data.items,
    month.start,
    month.end,
  ).filter((occurrence) => occurrence.budgetMonth === month.key);
  const fixedOccurrences = monthOccurrences.filter(
    (occurrence) =>
      occurrence.type === "expense" && occurrence.recurrence !== "none",
  );
  const fixedCosts = groupFixedCosts(fixedOccurrences);
  const fixedTotal = fixedCosts.reduce((total, cost) => total + cost.total, 0);
  const plannedExpenses = monthOccurrences
    .filter((occurrence) => occurrence.type === "expense")
    .reduce((total, occurrence) => total + occurrence.amount, 0);
  const plannedIncome = monthOccurrences
    .filter((occurrence) => occurrence.type === "income")
    .reduce((total, occurrence) => total + occurrence.amount, 0);
  const remainingAfterFixed = plannedIncome - fixedTotal;
  const fixedShare =
    plannedExpenses > 0 ? Math.round((fixedTotal / plannedExpenses) * 100) : 0;
  const categoryBreakdown = buildBreakdown(
    fixedCosts,
    (cost) => cost.category,
  );
  const assignedBreakdown = buildBreakdown(
    fixedCosts,
    (cost) => cost.assignedToName,
  );
  const { currency, locale } = viewer.profile;
  const budgetPeriodLabel = formatBudgetPeriod(month, locale);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Rapporten"
        title="Vaste lasten"
        description="Een helder maandrapport van terugkerende uitgaven uit de financiele agenda."
        actions={
          <AddFinancialAgendaItemButton
            members={data.members}
            viewerId={viewer.profile.id}
          />
        }
      />

      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] sm:flex-row sm:items-center sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">Budgetmaand</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
            {budgetPeriodLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={`/finances/reports?month=${shiftMonth(month.key, -1)}`}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Vorige maand"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Link
            href="/finances/reports"
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Vandaag
          </Link>
          <Link
            href={`/finances/reports?month=${shiftMonth(month.key, 1)}`}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Volgende maand"
          >
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBlock
          label="Vaste lasten"
          value={formatCurrency(fixedTotal, currency, locale)}
          meta={`${fixedCosts.length} ${
            fixedCosts.length === 1 ? "terugkerende post" : "terugkerende posten"
          }`}
          icon={ReceiptText}
        />
        <StatBlock
          label="Aandeel uitgaven"
          value={`${fixedShare}%`}
          meta="Van alle geplande uitgaven"
          icon={WalletCards}
        />
        <StatBlock
          label="Na vaste lasten"
          value={formatCurrency(remainingAfterFixed, currency, locale)}
          meta="Geplande inkomsten min vaste lasten"
          icon={CalendarDays}
        />
        <StatBlock
          label="Jaarindicatie"
          value={formatCurrency(fixedTotal * 12, currency, locale)}
          meta="Op basis van deze budgetmaand"
          icon={Repeat2}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <BreakdownList
          title="Per categorie"
          description="Welke soort vaste lasten het zwaarst meetelt."
          items={categoryBreakdown}
          total={fixedTotal}
          currency={currency}
          locale={locale}
        />
        <BreakdownList
          title="Per persoon"
          description="Wie in de agenda aan deze posten gekoppeld is."
          items={assignedBreakdown}
          total={fixedTotal}
          currency={currency}
          locale={locale}
        />
      </section>

      <Card className="min-w-0 p-5 sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
              Alle vaste lasten
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Terugkerende uitgaven die in deze budgetmaand vallen.
            </p>
          </div>
          <span className="w-fit rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
            {formatCurrency(fixedTotal, currency, locale)}
          </span>
        </div>

        {fixedCosts.length ? (
          <div className="divide-y divide-slate-100">
            {fixedCosts.map((cost) => (
              <FixedCostRow
                key={cost.id}
                cost={cost}
                currency={currency}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>
    </div>
  );
}
