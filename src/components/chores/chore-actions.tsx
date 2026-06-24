"use client";

import { Check, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  completeChoreAction,
  deleteChoreAction,
  reopenChoreAction,
} from "@/actions/chores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChoreActionButtons({
  id,
  title,
  completed,
  canDelete,
}: {
  id: string;
  title: string;
  completed: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) {
      return;
    }
    run(() => deleteChoreAction(id));
  }

  return (
    <div className="relative flex shrink-0 items-center gap-2">
      <Button
        variant={completed ? "secondary" : "primary"}
        size="sm"
        onClick={() =>
          run(() =>
            completed ? reopenChoreAction(id) : completeChoreAction(id),
          )
        }
        disabled={pending}
        className="min-w-24"
      >
        {completed ? (
          <RotateCcw className="size-4" />
        ) : (
          <Check className="size-4" />
        )}
        {completed ? "Terug" : "Gedaan"}
      </Button>
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className={cn(
            "grid size-9 place-items-center rounded-xl text-slate-300 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50",
          )}
          aria-label={`${title} verwijderen`}
        >
          <Trash2 className="size-4" />
        </button>
      )}
      {error && (
        <span className="absolute right-0 top-11 z-10 w-56 rounded-lg bg-red-600 px-2.5 py-2 text-left text-[11px] leading-4 text-white shadow-lg">
          {error}
        </span>
      )}
    </div>
  );
}
