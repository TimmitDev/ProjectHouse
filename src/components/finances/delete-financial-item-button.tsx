"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteFinancialAgendaItemAction } from "@/actions/financial-agenda";
import { deleteGoalAction } from "@/actions/goals";
import { cn } from "@/lib/utils";

export function DeleteFinancialItemButton({
  id,
  name,
  type,
  recurring = false,
  className,
}: {
  id: string;
  name: string;
  type: "agenda" | "goal";
  recurring?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    const detail =
      type === "agenda" && recurring
        ? " Hiermee verwijder je de volledige terugkerende reeks."
        : "";

    if (!window.confirm(`Weet je zeker dat je "${name}" wilt verwijderen?${detail}`)) {
      return;
    }

    setError(undefined);
    startTransition(async () => {
      const result =
        type === "agenda"
          ? await deleteFinancialAgendaItemAction(id)
          : await deleteGoalAction(id);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={cn(
          "grid size-8 place-items-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50",
          className,
        )}
        aria-label={`${name} verwijderen`}
        title={error ?? `${name} verwijderen`}
      >
        {pending ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </button>
      {error && (
        <span className="absolute right-0 top-9 z-10 w-52 rounded-lg bg-red-600 px-2.5 py-2 text-left text-[11px] leading-4 text-white shadow-lg">
          {error}
        </span>
      )}
    </span>
  );
}
