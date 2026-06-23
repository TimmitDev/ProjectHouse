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
import { getFinanceOverviewData, getViewer } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Financiën" };

export default async function FinancesPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("finances")) redirect("/modules");
  const data = await getFinanceOverviewData(viewer);
  const { currency, locale } = viewer.profile;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Financiën"
        title="Duidelijk inzicht in huishoudgeld"
        description="Eén gedeeld overzicht van inkomsten, uitgaven en voortgang — zonder spreadsheetchaos."
        actions={<AddTransactionButton />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Beschikbaar saldo"
          value={formatCurrency(data.balance, currency, locale)}
          meta="Alle geregistreerde activiteiten"
          type="balance"
        />
        <StatCard
          label="Maandelijkse inkomsten"
          value={formatCurrency(data.monthlyIncome, currency, locale)}
          meta="Deze maand"
          type="income"
        />
        <StatCard
          label="Maandelijkse uitgaven"
          value={formatCurrency(data.monthlyExpenses, currency, locale)}
          meta="Deze maand"
          type="expenses"
        />
        <StatCard
          label="Maandelijks gespaard"
          value={formatCurrency(data.monthlySavings, currency, locale)}
          meta={`${Math.max(0, data.savingsRate)}% spaarquote`}
          type="savings"
          positive={data.monthlySavings >= 0}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
              Deze maand
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Een eenvoudig overzicht van waar het geld naartoe gaat.
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
              { icon: CircleDollarSign, label: "Inkomsten" },
              { icon: ReceiptText, label: "Uitgaven" },
              { icon: PiggyBank, label: "Doelen" },
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
                Transacties
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                De meest recente huishoudtransacties.
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
