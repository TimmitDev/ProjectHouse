import { parseDateOnly, toDateOnly } from "@/lib/budget-period";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function normalizeCalendarMonthKey(monthKey: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)
    ? monthKey
    : toMonthKey(new Date());
}

export function getCalendarMonthRange(monthKey: string) {
  const safeKey = normalizeCalendarMonthKey(monthKey);
  const [year, month] = safeKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    key: safeKey,
    start: toDateOnly(start),
    end: toDateOnly(end),
    date: start,
  };
}

export function getCurrentCalendarMonthKey(referenceDate = new Date()) {
  return toMonthKey(referenceDate);
}

export function shiftCalendarMonth(monthKey: string, amount: number) {
  const safeKey = normalizeCalendarMonthKey(monthKey);
  const [year, month] = safeKey.split("-").map(Number);

  return toMonthKey(new Date(Date.UTC(year, month - 1 + amount, 1)));
}

export function getCalendarGridRange(monthKey: string) {
  const month = getCalendarMonthRange(monthKey);
  const start = parseDateOnly(month.start);
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  const gridStart = new Date(start.getTime() - mondayOffset * DAY_IN_MS);
  const gridEnd = new Date(gridStart.getTime() + 41 * DAY_IN_MS);

  return {
    start: toDateOnly(gridStart),
    end: toDateOnly(gridEnd),
  };
}

export function eachCalendarDate(rangeStart: string, rangeEnd: string) {
  const start = parseDateOnly(rangeStart);
  const end = parseDateOnly(rangeEnd);
  const dates: string[] = [];

  for (
    let current = start;
    current <= end;
    current = new Date(current.getTime() + DAY_IN_MS)
  ) {
    dates.push(toDateOnly(current));
  }

  return dates;
}

const monthFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatCalendarMonth(monthKey: string, locale = "nl-NL") {
  const month = getCalendarMonthRange(monthKey);
  let formatter = monthFormatters.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    monthFormatters.set(locale, formatter);
  }

  return formatter.format(month.date);
}

