"use client";

import {
  Boxes,
  CalendarDays,
  ChevronDown,
  Goal,
  LayoutDashboard,
  Menu,
  ShoppingBasket,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { HouseholdRail } from "@/components/app/household-rail";
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
  const groceriesEnabled = viewer.enabledModules.includes("groceries");

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

  const navigationSidebar = (
    <aside className="flex h-full w-[224px] shrink-0 flex-col border-r border-slate-200/80 bg-white px-3 py-5">
      <div className="flex items-start justify-between gap-2 px-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Je bent thuis in
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {viewer.household?.name}
          </p>
          <p className="mt-0.5 text-[11px] capitalize text-slate-400">
            {viewer.household &&
              formatHouseholdRole(viewer.household.role)}
          </p>
        </div>
        <button
          className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Navigatie sluiten"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-1" aria-label="Hoofdnavigatie">
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
                {navLink(
                  "/finances/agenda",
                  "Agenda",
                  CalendarDays,
                  true,
                )}
                {navLink("/finances/goals", "Spaardoelen", Goal, true)}
              </div>
            )}
          </div>
        )}

        {groceriesEnabled &&
          navLink("/groceries", "Boodschappen", ShoppingBasket)}
      </nav>

      <div className="space-y-1 border-t border-slate-100 pt-4">
        {navLink("/modules", "Modules", Boxes)}

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
        </div>
      </div>
    </aside>
  );

  const sidebar = (
    <div className="flex h-full w-[296px]">
      <HouseholdRail
        households={viewer.households}
        activeHouseholdId={viewer.household?.id}
        returnTo={pathname}
        profile={viewer.profile}
      />
      {navigationSidebar}
    </div>
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

      <div className="lg:pl-[296px]">
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
