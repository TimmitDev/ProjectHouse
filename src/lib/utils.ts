import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(date: string | Date, locale = "nl-NL") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatLongDate(date = new Date(), locale = "nl-NL") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
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
