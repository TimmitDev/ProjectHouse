"use client";

import {
  CalendarDays,
  ListChecks,
  NotebookText,
  ShoppingBasket,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toggleModuleAction } from "@/actions/modules";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ModuleKey } from "@/types/app";

const icons = {
  wallet: WalletCards,
  calendar: CalendarDays,
  sparkles: ListChecks,
  shopping: ShoppingBasket,
  notes: NotebookText,
};

export function ModuleCard({
  module,
  enabled,
  canManage,
}: {
  module: {
    key: ModuleKey;
    name: string;
    description: string;
    icon: keyof typeof icons;
    available: boolean;
  };
  enabled: boolean;
  canManage: boolean;
}) {
  const Icon = icons[module.icon];
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!canManage || !module.available || pending) return;
    const nextValue = !checked;
    setError(undefined);
    setChecked(nextValue);
    startTransition(async () => {
      const result = await toggleModuleAction(module.key, nextValue);
      if (result.error) {
        setChecked(!nextValue);
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <Card className="flex min-h-52 flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
          <Icon className="size-5" />
        </div>
        {!module.available ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Binnenkort
          </span>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={toggle}
            disabled={!canManage || pending}
            className={cn(
              "relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50",
              checked ? "bg-[var(--accent)]" : "bg-slate-200",
            )}
            aria-label={`${checked ? "Deactiveer" : "Activeer"} ${module.name}`}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all",
                checked ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        )}
      </div>
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-900">{module.name}</h2>
          {checked && module.available && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {module.description}
        </p>
      </div>
      <p className="mt-auto pt-5 text-xs text-slate-400">
        {!canManage
          ? "Alleen beheerders kunnen modules wijzigen"
          : checked
            ? "Actief voor je huishouden"
            : module.available
              ? "Niet actief"
              : "In ontwikkeling"}
      </p>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
    </Card>
  );
}
