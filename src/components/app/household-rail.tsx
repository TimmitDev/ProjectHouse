"use client";

import {
  Building2,
  House,
  Sparkles,
  TentTree,
  Trees,
  Waves,
} from "lucide-react";
import Link from "next/link";

import { switchHouseholdAction } from "@/actions/household-switcher";
import { cn, formatHouseholdRole } from "@/lib/utils";
import type { Household } from "@/types/app";

const portraits = [
  {
    className:
      "bg-[linear-gradient(145deg,#f59e0b_0%,#ea580c_48%,#7c2d12_100%)]",
    icon: House,
  },
  {
    className:
      "bg-[linear-gradient(145deg,#6ee7b7_0%,#0f766e_54%,#134e4a_100%)]",
    icon: Trees,
  },
  {
    className:
      "bg-[linear-gradient(145deg,#93c5fd_0%,#4f46e5_52%,#312e81_100%)]",
    icon: Building2,
  },
  {
    className:
      "bg-[linear-gradient(145deg,#67e8f9_0%,#0284c7_50%,#164e63_100%)]",
    icon: Waves,
  },
  {
    className:
      "bg-[linear-gradient(145deg,#f9a8d4_0%,#a855f7_52%,#581c87_100%)]",
    icon: TentTree,
  },
];

function portraitFor(householdId: string) {
  const hash = Array.from(householdId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return portraits[hash % portraits.length];
}

function Tooltip({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <span className="pointer-events-none absolute left-[66px] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-left shadow-xl group-hover:block group-focus-within:block">
      <span className="block text-xs font-semibold text-white">{title}</span>
      {subtitle && (
        <span className="mt-0.5 block text-[10px] capitalize text-slate-400">
          {subtitle}
        </span>
      )}
      <span className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rotate-45 bg-slate-950" />
    </span>
  );
}

export function HouseholdRail({
  households,
  activeHouseholdId,
  returnTo,
}: {
  households: Household[];
  activeHouseholdId?: string;
  returnTo: string;
}) {
  return (
    <aside className="relative z-40 flex h-full w-[72px] shrink-0 flex-col items-center border-r border-white/5 bg-[#17211f] py-3.5">
      <Link
        href="/dashboard"
        className="group relative grid size-11 place-items-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:brightness-110"
        aria-label="Nestly overzicht"
      >
        <House className="size-5" strokeWidth={2.3} />
        <Tooltip title="Nestly" subtitle="Naar het overzicht" />
      </Link>

      <div className="my-3 h-px w-8 bg-white/10" />

      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 pb-2">
        {households.map((household) => {
          const active = household.id === activeHouseholdId;
          const portrait = portraitFor(household.id);
          const PortraitIcon = portrait.icon;

          return (
            <form
              key={household.id}
              action={switchHouseholdAction}
              className="group relative flex w-full justify-center py-1"
            >
              <input type="hidden" name="householdId" value={household.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <span
                className={cn(
                  "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all",
                  active
                    ? "h-8"
                    : "h-0 group-hover:h-4 group-focus-within:h-4",
                )}
              />
              <button
                type="submit"
                className={cn(
                  "relative grid size-11 place-items-center overflow-hidden text-white shadow-lg outline-none ring-offset-2 ring-offset-[#17211f] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white",
                  portrait.className,
                  active
                    ? "rounded-2xl"
                    : "rounded-[22px] group-hover:rounded-2xl group-focus-within:rounded-2xl",
                )}
                aria-label={`Open ${household.name}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="absolute -right-2 -top-3 size-8 rounded-full bg-white/20 blur-[1px]" />
                <span className="absolute -bottom-4 -left-2 size-9 rounded-full bg-black/15" />
                <PortraitIcon
                  className="relative size-5 drop-shadow-sm"
                  strokeWidth={2.2}
                />
                {active && (
                  <span className="absolute bottom-1 right-1 size-2 rounded-full border-2 border-white bg-emerald-400" />
                )}
              </button>
              <Tooltip
                title={household.name}
                subtitle={
                  active
                    ? `Actief · ${formatHouseholdRole(household.role)}`
                    : formatHouseholdRole(household.role)
                }
              />
            </form>
          );
        })}
      </div>

      <div className="my-2 h-px w-8 bg-white/10" />

      <Link
        href="/modules"
        className="group relative grid size-10 place-items-center rounded-[20px] border border-dashed border-white/20 text-white/55 transition hover:rounded-2xl hover:border-white/40 hover:bg-white/10 hover:text-white"
        aria-label="Modules ontdekken"
      >
        <Sparkles className="size-[18px]" />
        <Tooltip title="Modules ontdekken" />
      </Link>
    </aside>
  );
}
