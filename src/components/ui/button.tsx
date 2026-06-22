import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55",
    {
      "bg-[var(--accent)] text-white shadow-sm hover:brightness-95":
        variant === "primary",
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50":
        variant === "secondary",
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900":
        variant === "ghost",
      "bg-red-600 text-white hover:bg-red-700": variant === "danger",
      "h-9 px-3 text-sm": size === "sm",
      "h-11 px-4 text-sm": size === "md",
      "h-12 px-5 text-[15px]": size === "lg",
    },
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
