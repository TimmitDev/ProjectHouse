"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteCalendarEventAction } from "@/actions/calendar";
import { cn } from "@/lib/utils";

export function DeleteCalendarEventButton({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) {
      return;
    }

    setError(undefined);
    startTransition(async () => {
      const result = await deleteCalendarEventAction(id);

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
        aria-label={`${title} verwijderen`}
        title={error ?? `${title} verwijderen`}
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
