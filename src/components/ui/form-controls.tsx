import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_16%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_16%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={className}
      variant={variant}
      size={size}
    >
      {pending && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function ActionMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3.5 py-3 text-sm",
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {error ?? success}
    </div>
  );
}
