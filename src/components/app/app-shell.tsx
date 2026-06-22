"use client";

import {
  Boxes,
  ChevronDown,
  Goal,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn, formatHouseholdRole, getInitials } from "@/lib/utils";
import type { Viewer } from "@/types/app";

const mainNav = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
];

export function AppShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(
    pathname.startsWith("/finances"),
  );
  const financesEnabled = viewer.enabledModules.includes("finances");

  const navLink = (
    href: string,
    label: string,
    Icon: typeof LayoutDashboard,
    nested = false,
  ) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
          nested && "ml-5 h-9",
          active
            ? "bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
        )}
      >
        <Icon className={cn("size-[18px]", nested && "size-4")} />
        {label}
      </Link>
    );
  };

  const sidebar = (
    <aside className="flex h-full w-[268px] flex-col border-r border-slate-200/80 bg-white px-4 py-5">
      <div className="flex items-center justify-between px-2">
        <Logo />
        <button
          className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Navigatie sluiten"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-8 px-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-xs font-semibold text-white">
            {getInitials(viewer.household?.name ?? "Mijn huishouden")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {viewer.household?.name}
            </p>
            <p className="text-xs capitalize text-slate-400">
              {viewer.household && formatHouseholdRole(viewer.household.role)}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1" aria-label="Hoofdnavigatie">
        {mainNav.map((item) =>
          navLink(item.href, item.label, item.icon),
        )}

        {financesEnabled && (
          <div>
            <button
              type="button"
              onClick={() => setFinanceOpen((value) => !value)}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                pathname.startsWith("/finances")
                  ? "text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              )}
              aria-expanded={financeOpen}
            >
              <WalletCards className="size-[18px]" />
              <span className="flex-1 text-left">Financiën</span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  financeOpen && "rotate-180",
                )}
              />
            </button>
            {financeOpen && (
              <div className="mt-1 space-y-1">
                {navLink("/finances", "Samenvatting", WalletCards, true)}
                {navLink("/finances/goals", "Spaardoelen", Goal, true)}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="space-y-1 border-t border-slate-100 pt-4">
        {navLink("/modules", "Modules", Boxes)}
        {navLink("/settings", "Instellingen", Settings)}

        <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {getInitials(viewer.profile.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">
              {viewer.profile.fullName}
            </p>
            <p className="truncate text-xs text-slate-400">
              {viewer.profile.email}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Uitloggen"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );

  return (
    <div
      className="min-h-screen bg-[#f7f8f6]"
      style={{ "--accent": viewer.profile.accentColor } as React.CSSProperties}
    >
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Navigatie sluiten"
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-[#f7f8f6]/90 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <Logo compact />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Navigatie openen"
          >
            <Menu className="size-4" />
          </Button>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
