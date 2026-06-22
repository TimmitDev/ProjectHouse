import { Home } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f6] p-6 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <Home className="size-6" />
        </span>
        <p className="mt-6 text-sm font-medium text-[var(--accent)]">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          This room does not exist
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The page may have moved or the address is incorrect.
        </p>
        <Link
          href="/dashboard"
          className={buttonVariants({ className: "mt-6" })}
        >
          Back to overview
        </Link>
      </div>
    </main>
  );
}
