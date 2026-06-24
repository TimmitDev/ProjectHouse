"use client";

import { Pin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteNoteAction,
  toggleNotePinnedAction,
} from "@/actions/notes";
import { cn } from "@/lib/utils";

export function NoteActionButtons({
  id,
  title,
  pinned,
  canDelete,
}: {
  id: string;
  title: string;
  pinned: boolean;
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
    run(() => deleteNoteAction(id));
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => run(() => toggleNotePinnedAction(id, !pinned))}
        disabled={pending}
        className={cn(
          "grid size-9 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50",
          pinned
            ? "bg-[color-mix(in_srgb,var(--accent)_12%,white)] text-[var(--accent)]"
            : "text-slate-300 hover:bg-slate-50 hover:text-slate-600",
        )}
        aria-label={`${title} ${pinned ? "losmaken" : "vastpinnen"}`}
      >
        <Pin className="size-4" />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="grid size-9 place-items-center rounded-xl text-slate-300 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
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
