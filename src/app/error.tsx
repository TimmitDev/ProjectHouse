"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f6] p-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-slate-950">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          We could not load this page. Your data has not been changed.
        </p>
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </main>
  );
}
