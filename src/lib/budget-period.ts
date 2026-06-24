import type { BudgetPeriod } from "@/types/app";

export const BUDGET_MONTH_START_DAY = 24;

export function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function normalizeMonthKey(monthKey: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)
    ? monthKey
    : getCurrentBudgetPeriod().key;
}

export function getBudgetPeriodForMonth(monthKey: string): BudgetPeriod {
  const safeKey = normalizeMonthKey(monthKey);
  const [year, month] = safeKey.split("-").map(Number);
  const start = new Date(
    Date.UTC(year, month - 1, BUDGET_MONTH_START_DAY),
  );
  const end = new Date(
    Date.UTC(year, month, BUDGET_MONTH_START_DAY - 1),
  );

  return {
    key: safeKey,
    start: toDateOnly(start),
    end: toDateOnly(end),
  };
}

export function getCurrentBudgetPeriod(referenceDate = new Date()) {
  const currentDay = referenceDate.getDate();
  const periodStartMonth =
    currentDay >= BUDGET_MONTH_START_DAY
      ? referenceDate.getMonth()
      : referenceDate.getMonth() - 1;
  const periodStart = new Date(
    Date.UTC(referenceDate.getFullYear(), periodStartMonth, 1),
  );

  return getBudgetPeriodForMonth(toMonthKey(periodStart));
}

export function getCurrentBudgetMonthKey(referenceDate = new Date()) {
  return getCurrentBudgetPeriod(referenceDate).key;
}

export function getBudgetMonthKeyForDate(
  date: Date,
  monthOffset: 0 | 1 = 0,
) {
  const periodStartMonth =
    date.getUTCDate() >= BUDGET_MONTH_START_DAY
      ? date.getUTCMonth()
      : date.getUTCMonth() - 1;
  const periodStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      periodStartMonth + monthOffset,
      1,
    ),
  );

  return toMonthKey(periodStart);
}

export function shiftBudgetMonth(monthKey: string, amount: number) {
  const safeKey = normalizeMonthKey(monthKey);
  const [year, month] = safeKey.split("-").map(Number);

  return toMonthKey(new Date(Date.UTC(year, month - 1 + amount, 1)));
}

export function formatBudgetPeriod(
  period: BudgetPeriod,
  locale = "nl-NL",
) {
  const start = parseDateOnly(period.start);
  const end = parseDateOnly(period.end);
  const includeStartYear = start.getUTCFullYear() !== end.getUTCFullYear();
  const startLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: includeStartYear ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);

  return `${startLabel} - ${endLabel}`;
}
