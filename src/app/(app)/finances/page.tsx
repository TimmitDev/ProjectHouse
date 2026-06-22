import { CircleDollarSign, PiggyBank, ReceiptText, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  SpendingBars,
  StatCard,
  TransactionList,
} from "@/components/dashboard/widgets";
import { AddTransactionButton } from "@/components/finances/transaction-form";
import { Card, PageHeader } from "@/components/ui/card";
import { getDashboardData, getViewer } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Finances" };

export default async function FinancesPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("finances")) redirect("/modules");
  const data = await getDashboardData(viewer);
  const { currency, locale } = viewer.profile;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Finances"
        title="Household money, made clear"
        description="A shared view of income, spending and progress — without spreadsheet chaos."
        actions={<AddTransactionButton />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Available balance"
          value={formatCurrency(data.balance, currency, locale)}
          meta="All recorded activity"
          type="balance"
        />
        <StatCard
          label="Monthly income"
          value={formatCurrency(data.monthlyIncome, currency, locale)}
          meta="This month"
          type="income"
        />
        <StatCard
          label="Monthly expenses"
          value={formatCurrency(data.monthlyExpenses, currency, locale)}
          meta="This month"
          type="expenses"
        />
        <StatCard
          label="Monthly savings"
          value={formatCurrency(data.monthlySavings, currency, locale)}
          meta={`${Math.max(0, data.savingsRate)}% rate`}
          type="savings"
          positive={data.monthlySavings >= 0}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
              This month
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              A simple view of where money is going.
            </p>
          </div>
          <SpendingBars
            income={data.monthlyIncome}
            expenses={data.monthlyExpenses}
            savings={data.monthlySavings}
            currency={currency}
            locale={locale}
          />
          <div className="mt-8 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center">
            {[
              { icon: CircleDollarSign, label: "Income" },
              { icon: ReceiptText, label: "Spending" },
              { icon: PiggyBank, label: "Goals" },
            ].map((item) => (
              <div key={item.label}>
                <item.icon className="mx-auto size-4 text-slate-400" />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
                Transactions
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Most recent household entries.
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-400">
              <Wallet className="size-4" />
            </span>
          </div>
          <TransactionList
            transactions={data.transactions}
            currency={currency}
            locale={locale}
          />
        </Card>
      </section>
    </div>
  );
}
