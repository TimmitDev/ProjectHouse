import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  GoalProgress,
  SpendingBars,
  StatCard,
  TransactionList,
} from "@/components/dashboard/widgets";
import { InviteCode } from "@/components/household/invite-code";
import { Card, PageHeader } from "@/components/ui/card";
import { getDashboardData, getViewer } from "@/lib/data";
import {
  formatCurrency,
  formatLongDate,
  getFirstName,
  getInitials,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  const data = await getDashboardData(viewer);
  const { currency, locale } = viewer.profile;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={formatLongDate(new Date(), locale)}
        title={`Good morning, ${getFirstName(viewer.profile.fullName)}`}
        description={`Here is what is happening in ${viewer.household.name} today.`}
        actions={
          viewer.isDemo ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_22%,white)] bg-[color-mix(in_srgb,var(--accent)_8%,white)] px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
              <CheckCircle2 className="size-3.5" />
              Sample household
            </span>
          ) : undefined
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Available balance"
          value={formatCurrency(data.balance, currency, locale)}
          meta="Across household activity"
          type="balance"
        />
        <StatCard
          label="Income this month"
          value={formatCurrency(data.monthlyIncome, currency, locale)}
          meta="Monthly"
          type="income"
        />
        <StatCard
          label="Expenses this month"
          value={formatCurrency(data.monthlyExpenses, currency, locale)}
          meta="Monthly"
          type="expenses"
        />
        <StatCard
          label="Saved this month"
          value={formatCurrency(data.monthlySavings, currency, locale)}
          meta={`${Math.max(0, data.savingsRate)}% rate`}
          type="savings"
          positive={data.monthlySavings >= 0}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
                Monthly overview
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Income, expenses and the amount left to save.
              </p>
            </div>
            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
              This month
            </span>
          </div>
          <SpendingBars
            income={data.monthlyIncome}
            expenses={data.monthlyExpenses}
            savings={data.monthlySavings}
            currency={currency}
            locale={locale}
          />
          <div className="mt-7 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Savings rate</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {Math.max(0, data.savingsRate)}%
                </p>
              </div>
              <div className="w-2/3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{
                      width: `${Math.min(100, Math.max(0, data.savingsRate))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-right text-[11px] text-slate-400">
                  of monthly household income
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
                Household
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {data.members.length}{" "}
                {data.members.length === 1 ? "member" : "members"}
              </p>
            </div>
            <div className="flex -space-x-2">
              {data.members.slice(0, 4).map((member) => (
                <span
                  key={member.id}
                  className="grid size-9 place-items-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-600"
                  title={member.name}
                >
                  {getInitials(member.name)}
                </span>
              ))}
            </div>
          </div>
          <div className="my-5 h-px bg-slate-100" />
          <InviteCode code={viewer.household.inviteCode} />
          <div className="mt-5 space-y-3">
            {data.members.slice(0, 3).map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_9%,white)] text-[10px] font-semibold text-[var(--accent)]">
                  {getInitials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {member.name}
                  </p>
                  <p className="text-xs capitalize text-slate-400">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
                Savings goals
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Shared progress towards what matters.
              </p>
            </div>
            <Link
              href="/finances/goals"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {data.goals.length ? (
            <div className="space-y-6">
              {data.goals.slice(0, 3).map((goal) => (
                <GoalProgress
                  key={goal.id}
                  goal={goal}
                  currency={currency}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-200 text-center">
              <div>
                <CalendarDays className="mx-auto size-6 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  No goals yet
                </p>
                <Link
                  href="/finances/goals"
                  className="mt-2 inline-block text-xs font-medium text-[var(--accent)]"
                >
                  Create your first goal
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
                Recent activity
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Latest shared finance entries.
              </p>
            </div>
            <Link
              href="/finances"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <TransactionList
            transactions={data.transactions}
            currency={currency}
            locale={locale}
            limit={4}
          />
        </Card>
      </section>

      <Card className="flex flex-col gap-4 bg-[var(--accent)] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/12">
            <UsersRound className="size-5" />
          </span>
          <div>
            <p className="font-medium">Make Nestly yours</p>
            <p className="mt-1 text-sm text-white/70">
              Choose which modules your household sees and uses.
            </p>
          </div>
        </div>
        <Link
          href="/modules"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-[var(--accent)] transition hover:bg-white/90"
        >
          Manage modules <ArrowRight className="size-4" />
        </Link>
      </Card>
    </div>
  );
}
