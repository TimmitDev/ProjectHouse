import type {
  FinancialAgendaItem,
  FinancialAgendaOccurrence,
} from "@/types/app";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function occurrenceAt(item: FinancialAgendaItem, index: number) {
  const start = parseDateOnly(item.dueDate);

  if (item.recurrence === "weekly") {
    return new Date(start.getTime() + index * 7 * DAY_IN_MS);
  }

  if (item.recurrence === "monthly") {
    const targetMonth = start.getUTCMonth() + index;
    const year = start.getUTCFullYear() + Math.floor(targetMonth / 12);
    const month = ((targetMonth % 12) + 12) % 12;
    return new Date(
      Date.UTC(
        year,
        month,
        Math.min(start.getUTCDate(), daysInMonth(year, month)),
      ),
    );
  }

  if (item.recurrence === "yearly") {
    const year = start.getUTCFullYear() + index;
    return new Date(
      Date.UTC(
        year,
        start.getUTCMonth(),
        Math.min(
          start.getUTCDate(),
          daysInMonth(year, start.getUTCMonth()),
        ),
      ),
    );
  }

  return start;
}

function firstRelevantIndex(
  item: FinancialAgendaItem,
  rangeStart: Date,
) {
  const itemStart = parseDateOnly(item.dueDate);

  if (itemStart >= rangeStart || item.recurrence === "none") {
    return 0;
  }

  if (item.recurrence === "weekly") {
    return Math.max(
      0,
      Math.floor((rangeStart.getTime() - itemStart.getTime()) / (7 * DAY_IN_MS)) -
        1,
    );
  }

  if (item.recurrence === "monthly") {
    const monthDifference =
      (rangeStart.getUTCFullYear() - itemStart.getUTCFullYear()) * 12 +
      rangeStart.getUTCMonth() -
      itemStart.getUTCMonth();
    return Math.max(0, monthDifference - 1);
  }

  return Math.max(
    0,
    rangeStart.getUTCFullYear() - itemStart.getUTCFullYear() - 1,
  );
}

export function expandFinancialAgendaItems(
  items: FinancialAgendaItem[],
  rangeStart: string,
  rangeEnd: string,
) {
  const start = parseDateOnly(rangeStart);
  const end = parseDateOnly(rangeEnd);
  const occurrences: FinancialAgendaOccurrence[] = [];

  for (const item of items) {
    if (item.recurrence === "none") {
      const dueDate = parseDateOnly(item.dueDate);
      if (dueDate >= start && dueDate <= end) {
        occurrences.push({ ...item, occurrenceDate: item.dueDate });
      }
      continue;
    }

    const firstIndex = firstRelevantIndex(item, start);
    for (let offset = 0; offset < 5000; offset += 1) {
      const index = firstIndex + offset;
      const date = occurrenceAt(item, index);
      if (date > end) break;
      if (date >= start) {
        occurrences.push({ ...item, occurrenceDate: toDateOnly(date) });
      }
    }
  }

  return occurrences.sort(
    (a, b) =>
      a.occurrenceDate.localeCompare(b.occurrenceDate) ||
      a.title.localeCompare(b.title),
  );
}

export function getMonthRange(monthKey: string) {
  const isValid = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey);
  const safeKey = isValid ? monthKey : new Date().toISOString().slice(0, 7);
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

export function shiftMonth(monthKey: string, amount: number) {
  const { date } = getMonthRange(monthKey);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1),
  )
    .toISOString()
    .slice(0, 7);
}

export function getCalendarRange(monthKey: string) {
  const month = getMonthRange(monthKey);
  const start = parseDateOnly(month.start);
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  const calendarStart = new Date(start.getTime() - mondayOffset * DAY_IN_MS);
  const calendarEnd = new Date(calendarStart.getTime() + 41 * DAY_IN_MS);

  return {
    start: toDateOnly(calendarStart),
    end: toDateOnly(calendarEnd),
  };
}

export function eachDate(rangeStart: string, rangeEnd: string) {
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
