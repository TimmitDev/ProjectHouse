import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const longDateFormatters = new Map<string, Intl.DateTimeFormat>();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatCurrency(
  value: number,
  currency = "EUR",
  locale = "nl-NL",
) {
  const maximumFractionDigits = value % 1 === 0 ? 0 : 2;
  const key = `${locale}:${currency}:${maximumFractionDigits}`;
  let formatter = currencyFormatters.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits,
    });
    currencyFormatters.set(key, formatter);
  }

  return formatter.format(value);
}

export function formatDate(date: string | Date, locale = "nl-NL") {
  let formatter = dateFormatters.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    dateFormatters.set(locale, formatter);
  }

  return formatter.format(new Date(date));
}

export function formatLongDate(date = new Date(), locale = "nl-NL") {
  let formatter = longDateFormatters.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    longDateFormatters.set(locale, formatter);
  }

  return formatter.format(date);
}

export function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function formatHouseholdRole(role: "owner" | "admin" | "member") {
  return {
    owner: "eigenaar",
    admin: "beheerder",
    member: "lid",
  }[role];
}
