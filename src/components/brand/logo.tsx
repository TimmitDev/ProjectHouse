import { House } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  href = "/dashboard",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-[-0.03em] text-slate-900",
        className,
      )}
      aria-label="Nestly startpagina"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
        <House className="size-[18px]" strokeWidth={2.25} />
      </span>
      {!compact && <span className="text-xl">Nestly</span>}
    </Link>
  );
}
