import {
  Bath,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Home,
  Landmark,
  Sofa,
  Sparkles,
  TreePine,
  UserRound,
  Utensils,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChoreActionButtons } from "@/components/chores/chore-actions";
import { AddChoreButton } from "@/components/chores/chore-form";
import { Card, PageHeader } from "@/components/ui/card";
import { getChoresData, getViewer } from "@/lib/data";
import { cn, formatDate } from "@/lib/utils";
import type {
  ChoreArea,
  ChoreFrequency,
  HouseholdChore,
} from "@/types/app";

export const metadata: Metadata = { title: "Huishoudelijke taken" };

const areaConfig = {
  kitchen: {
    label: "Keuken",
    icon: Utensils,
    color: "bg-orange-50 text-orange-700",
  },
  bathroom: {
    label: "Badkamer",
    icon: Bath,
    color: "bg-sky-50 text-sky-700",
  },
  living: {
    label: "Woonkamer",
    icon: Sofa,
    color: "bg-emerald-50 text-emerald-700",
  },
  bedroom: {
    label: "Slaapkamer",
    icon: Home,
    color: "bg-violet-50 text-violet-700",
  },
  outside: {
    label: "Buiten",
    icon: TreePine,
    color: "bg-lime-50 text-lime-700",
  },
  admin: {
    label: "Administratie",
    icon: Landmark,
    color: "bg-slate-100 text-slate-700",
  },
  other: {
    label: "Overig",
    icon: Sparkles,
    color: "bg-stone-100 text-stone-700",
  },
} satisfies Record<
  ChoreArea,
  { label: string; icon: typeof ClipboardList; color: string }
>;

const frequencyLabels: Record<ChoreFrequency, string> = {
  once: "Eenmalig",
  daily: "Dagelijks",
  weekly: "Wekelijks",
  biweekly: "Elke twee weken",
  monthly: "Maandelijks",
};

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function StatCard({
  label,
  value,
  meta,
  icon: Icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof ClipboardList;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
        <Icon className="size-[18px]" />
      </span>
      <p className="mt-5 text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{meta}</p>
    </Card>
  );
}

function ChoreRow({
  chore,
  locale,
  today,
  canDelete,
}: {
  chore: HouseholdChore;
  locale: string;
  today: string;
  canDelete: boolean;
}) {
  const area = areaConfig[chore.area];
  const Icon = area.icon;
  const completed = Boolean(chore.completedAt);
  const overdue = !completed && chore.dueDate < today;
  const dueToday = !completed && chore.dueDate === today;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between",
        completed && "opacity-70",
      )}
    >
      <div className="flex min-w-0 gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            area.color,
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "text-sm font-semibold text-slate-800",
                completed && "line-through",
              )}
            >
              {chore.title}
            </p>
            {overdue && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                Te laat
              </span>
            )}
            {dueToday && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Vandaag
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {area.label} - {frequencyLabels[chore.frequency]} -{" "}
            {completed ? "afgerond" : `voor ${formatDate(chore.dueDate, locale)}`}
          </p>
          {chore.description && (
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
              {chore.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
              <UserRound className="size-3" />
              {chore.assignedToName}
            </span>
            {chore.lastCompletedAt && !completed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
                <CheckCircle2 className="size-3" />
                Laatst {formatDate(chore.lastCompletedAt, locale)}
              </span>
            )}
          </div>
        </div>
      </div>

      <ChoreActionButtons
        id={chore.id}
        title={chore.title}
        completed={completed}
        canDelete={canDelete}
      />
    </div>
  );
}

function ChoreList({
  title,
  description,
  chores,
  locale,
  today,
  viewerId,
  canManageAll,
}: {
  title: string;
  description: string;
  chores: HouseholdChore[];
  locale: string;
  today: string;
  viewerId: string;
  canManageAll: boolean;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
          {chores.length}
        </span>
      </div>
      {chores.length ? (
        <div className="divide-y divide-slate-100">
          {chores.map((chore) => (
            <ChoreRow
              key={chore.id}
              chore={chore}
              locale={locale}
              today={today}
              canDelete={canManageAll || chore.createdBy === viewerId}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-44 place-items-center rounded-xl border border-dashed border-slate-200 text-center">
          <div>
            <ClipboardList className="mx-auto size-6 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              Geen taken
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default async function ChoresPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("chores")) redirect("/modules");
  const household = viewer.household;
  const data = await getChoresData(viewer);
  const today = new Date().toISOString().slice(0, 10);
  const soonEnd = addDaysIso(7);
  const openChores = data.chores.filter((chore) => !chore.completedAt);
  const completedChores = data.chores.filter((chore) => chore.completedAt);
  const overdueChores = openChores.filter((chore) => chore.dueDate < today);
  const soonChores = openChores.filter(
    (chore) => chore.dueDate >= today && chore.dueDate <= soonEnd,
  );
  const laterChores = openChores.filter((chore) => chore.dueDate > soonEnd);
  const assignedToMe = openChores.filter(
    (chore) => chore.assignedTo === viewer.profile.id,
  );
  const canManageAll = household.role !== "member";
  const { locale } = viewer.profile;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Samen doen"
        title="Huishoudelijke taken"
        description={`Verdeel het werk in ${household.name} en houd terugkerende taken bij.`}
        actions={<AddChoreButton members={data.members} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open taken"
          value={`${openChores.length}`}
          meta="Nog te doen"
          icon={ClipboardList}
        />
        <StatCard
          label="Te laat"
          value={`${overdueChores.length}`}
          meta="Deadline is verstreken"
          icon={CalendarClock}
        />
        <StatCard
          label="Voor jou"
          value={`${assignedToMe.length}`}
          meta="Aan jou toegewezen"
          icon={UserRound}
        />
        <StatCard
          label="Afgerond"
          value={`${completedChores.length}`}
          meta="Eenmalige taken"
          icon={CheckCircle2}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <div className="space-y-5">
          {overdueChores.length > 0 && (
            <ChoreList
              title="Achterstallig"
              description="Deze taken verdienen als eerste aandacht."
              chores={overdueChores}
              locale={locale}
              today={today}
              viewerId={viewer.profile.id}
              canManageAll={canManageAll}
            />
          )}
          <ChoreList
            title="Binnenkort"
            description="Taken voor vandaag en de komende zeven dagen."
            chores={soonChores}
            locale={locale}
            today={today}
            viewerId={viewer.profile.id}
            canManageAll={canManageAll}
          />
          {laterChores.length > 0 && (
            <ChoreList
              title="Later"
              description="Rustig gepland voor verder vooruit."
              chores={laterChores}
              locale={locale}
              today={today}
              viewerId={viewer.profile.id}
              canManageAll={canManageAll}
            />
          )}
        </div>

        <ChoreList
          title="Afgerond"
          description="Eenmalige taken die zijn afgevinkt."
          chores={completedChores}
          locale={locale}
          today={today}
          viewerId={viewer.profile.id}
          canManageAll={canManageAll}
        />
      </section>
    </div>
  );
}
