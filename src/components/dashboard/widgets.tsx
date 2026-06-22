import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Landmark,
  PiggyBank,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { SavingsGoal, Transaction } from "@/types/app";

const statIcons = {
  balance: Landmark,
  income: CircleDollarSign,
  expenses: ReceiptText,
  savings: PiggyBank,
};

export function StatCard({
  label,
  value,
  meta,
  type,
  positive,
}: {
  label: string;
  value: string;
  meta: string;
  type: keyof typeof statIcons;
  positive?: boolean;
}) {
  const Icon = statIcons[type];
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
          <Icon className="size-[18px]" />
        </div>
        {positive !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700",
            )}
          >
            <TrendingUp className="size-3" />
            {meta}
          </span>
        )}
      </div>
      <p className="mt-5 text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
        {value}
      </p>
      {positive === undefined && (
        <p className="mt-1 text-xs text-slate-400">{meta}</p>
      )}
    </Card>
  );
}

export function GoalProgress({
  goal,
  currency,
  locale,
  compact = false,
}: {
  goal: SavingsGoal;
  currency: string;
  locale: string;
  compact?: boolean;
}) {
  const percentage = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
  );

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {goal.name}
          </p>
          {!compact && goal.deadline && (
            <p className="mt-1 text-xs text-slate-400">
              Streefdatum {formatDate(goal.deadline, locale)}
            </p>
          )}
        </div>
        <p className="shrink-0 text-xs font-semibold text-slate-600">
          {percentage}%
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: goal.color }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">
          {formatCurrency(goal.currentAmount, currency, locale)}
        </span>
        <span className="text-slate-400">
          van {formatCurrency(goal.targetAmount, currency, locale)}
        </span>
      </div>
    </div>
  );
}

export function TransactionList({
  transactions,
  currency,
  locale,
  limit,
}: {
  transactions: Transaction[];
  currency: string;
  locale: string;
  limit?: number;
}) {
  const visible = limit ? transactions.slice(0, limit) : transactions;

  if (!visible.length) {
    return (
      <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-200 text-center">
        <div>
          <ReceiptText className="mx-auto size-6 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">
            Nog geen transacties
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Voeg inkomsten of uitgaven toe om ze hier te zien.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {visible.map((transaction) => {
        const income = transaction.type === "income";
        return (
          <div
            key={transaction.id}
            className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl",
                income
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              {income ? (
                <ArrowDownLeft className="size-[18px]" />
              ) : (
                <ArrowUpRight className="size-[18px]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {transaction.description}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {transaction.category} ·{" "}
                {formatDate(transaction.transactionDate, locale)}
              </p>
            </div>
            <p
              className={cn(
                "text-sm font-semibold",
                income ? "text-emerald-600" : "text-slate-800",
              )}
            >
              {income ? "+" : "−"}
              {formatCurrency(transaction.amount, currency, locale)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function SpendingBars({
  income,
  expenses,
  savings,
  currency,
  locale,
}: {
  income: number;
  expenses: number;
  savings: number;
  currency: string;
  locale: string;
}) {
  const max = Math.max(income, expenses, savings, 1);
  const bars = [
    { label: "Inkomsten", value: income, color: "bg-[var(--accent)]" },
    { label: "Uitgaven", value: expenses, color: "bg-[#d8a27d]" },
    { label: "Gespaard", value: savings, color: "bg-[#8097ba]" },
  ];

  return (
    <div className="space-y-5">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">{bar.label}</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(bar.value, currency, locale)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full", bar.color)}
              style={{ width: `${Math.round((bar.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
