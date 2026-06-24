import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  HeartPulse,
  Home,
  MapPin,
  PartyPopper,
  Plane,
  School,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddCalendarEventButton } from "@/components/calendar/calendar-event-form";
import { DeleteCalendarEventButton } from "@/components/calendar/delete-calendar-event-button";
import { Card, PageHeader } from "@/components/ui/card";
import {
  eachCalendarDate,
  formatCalendarMonth,
  getCalendarGridRange,
  getCalendarMonthRange,
  getCurrentCalendarMonthKey,
  shiftCalendarMonth,
} from "@/lib/calendar";
import { getCalendarEvents, getViewer } from "@/lib/data";
import { cn, formatDate } from "@/lib/utils";
import type {
  CalendarEvent,
  CalendarEventCategory,
} from "@/types/app";

export const metadata: Metadata = { title: "Agenda" };

const weekdays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

const categoryConfig = {
  home: {
    label: "Thuis",
    icon: Home,
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  appointment: {
    label: "Afspraak",
    icon: CalendarDays,
    color: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  school: {
    label: "School",
    icon: School,
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  work: {
    label: "Werk",
    icon: BriefcaseBusiness,
    color: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
  social: {
    label: "Sociaal",
    icon: PartyPopper,
    color: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  health: {
    label: "Gezondheid",
    icon: HeartPulse,
    color: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  travel: {
    label: "Reizen",
    icon: Plane,
    color: "bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  other: {
    label: "Overig",
    icon: CalendarDays,
    color: "bg-stone-100 text-stone-700",
    dot: "bg-stone-500",
  },
} satisfies Record<
  CalendarEventCategory,
  {
    label: string;
    icon: typeof CalendarDays;
    color: string;
    dot: string;
  }
>;

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) return "Hele dag";
  if (!event.startTime) return "Tijd onbekend";
  if (!event.endTime) return event.startTime;

  return `${event.startTime} - ${event.endTime}`;
}

function EventPill({ event }: { event: CalendarEvent }) {
  const category = categoryConfig[event.category];

  return (
    <div
      className={cn(
        "min-w-0 rounded-md px-1.5 py-1 text-[10px] leading-4 lg:px-2",
        category.color,
      )}
      title={`${event.title} - ${formatEventTime(event)}`}
    >
      <p className="truncate font-semibold">{event.title}</p>
      <p className="hidden truncate opacity-80 md:block">
        {formatEventTime(event)}
      </p>
    </div>
  );
}

function EventListItem({
  event,
  locale,
  canDelete,
}: {
  event: CalendarEvent;
  locale: string;
  canDelete: boolean;
}) {
  const category = categoryConfig[event.category];
  const Icon = category.icon;

  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          category.color,
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {event.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDate(event.eventDate, locale)} - {formatEventTime(event)}
            </p>
          </div>
          {canDelete && (
            <DeleteCalendarEventButton id={event.id} title={event.title} />
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
            <CalendarDays className="size-3" />
            {category.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
            <UserRound className="size-3" />
            {event.createdByName}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-slate-500">
              <MapPin className="size-3" />
              {event.location}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
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
  icon: typeof CalendarDays;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
        <Icon className="size-[18px]" />
      </span>
      <p className="mt-5 text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-[-0.035em] text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{meta}</p>
    </Card>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("calendar")) redirect("/modules");
  const household = viewer.household;

  const params = await searchParams;
  const requestedMonth = params.month || getCurrentCalendarMonthKey();
  const month = getCalendarMonthRange(requestedMonth);
  const gridRange = getCalendarGridRange(month.key);
  const dates = eachCalendarDate(gridRange.start, gridRange.end);
  const events = await getCalendarEvents(viewer, gridRange);
  const monthEvents = events.filter(
    (event) => event.eventDate >= month.start && event.eventDate <= month.end,
  );
  const eventsByDate = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dayEvents = eventsByDate.get(event.eventDate) ?? [];
    dayEvents.push(event);
    eventsByDate.set(event.eventDate, dayEvents);
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextEvent =
    events.find((event) => event.eventDate >= today) ?? monthEvents[0];
  const daysWithEvents = new Set(
    monthEvents.map((event) => event.eventDate),
  ).size;
  const categoryCount = new Set(
    monthEvents.map((event) => event.category),
  ).size;
  const { locale } = viewer.profile;
  const monthLabel = formatCalendarMonth(month.key, locale);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Samen plannen"
        title="Gedeelde agenda"
        description={`Alle afspraken van ${household.name} op een plek.`}
        actions={<AddCalendarEventButton />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Afspraken"
          value={`${monthEvents.length}`}
          meta="In deze maand"
          icon={CalendarDays}
        />
        <StatCard
          label="Dagen gevuld"
          value={`${daysWithEvents}`}
          meta="Met minimaal een afspraak"
          icon={Clock3}
        />
        <StatCard
          label="Categorieen"
          value={`${categoryCount}`}
          meta="Verschillende soorten afspraken"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Volgende"
          value={nextEvent ? formatDate(nextEvent.eventDate, locale) : "Geen"}
          meta={nextEvent ? nextEvent.title : "Nog niets gepland"}
          icon={ArrowRight}
        />
      </section>

      <section className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate font-semibold capitalize tracking-[-0.02em] text-slate-900">
                {monthLabel}
              </h2>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
                Maandoverzicht
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                href={`/calendar?month=${shiftCalendarMonth(month.key, -1)}`}
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Vorige maand"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <Link
                href="/calendar"
                className="hidden h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-flex"
              >
                Vandaag
              </Link>
              <Link
                href={`/calendar?month=${shiftCalendarMonth(month.key, 1)}`}
                className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Volgende maand"
              >
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {weekdays.map((day) => (
              <div
                key={day}
                className="min-w-0 px-0.5 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400 sm:px-3 sm:text-[11px] sm:tracking-[0.08em]"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dates.map((date, index) => {
              const dayEvents = eventsByDate.get(date) ?? [];
              const inMonth = date >= month.start && date <= month.end;
              const isToday = date === today;

              return (
                <div
                  key={date}
                  className={cn(
                    "min-h-[78px] min-w-0 border-b border-r border-slate-100 p-1 sm:min-h-32 sm:p-2 lg:p-2.5",
                    index % 7 === 6 && "border-r-0",
                    !inMonth && "bg-slate-50/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-[11px] font-medium sm:size-7 sm:text-xs",
                      inMonth ? "text-slate-600" : "text-slate-300",
                      isToday &&
                        "bg-[var(--accent)] font-semibold text-white",
                    )}
                  >
                    {Number(date.slice(-2))}
                  </span>

                  <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                    {dayEvents.slice(0, 4).map((event) => (
                      <span
                        key={event.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          categoryConfig[event.category].dot,
                        )}
                        title={`${event.title} - ${formatEventTime(event)}`}
                      />
                    ))}
                  </div>

                  <div className="mt-1.5 hidden min-w-0 space-y-1 sm:block">
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventPill key={event.id} event={event} />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="truncate px-1 text-[10px] font-medium text-slate-400">
                        +{dayEvents.length - 3} meer
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="min-w-0 self-start p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-slate-900">
                Afspraken deze maand
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {monthEvents.length} totaal
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-400">
              <CalendarDays className="size-4" />
            </span>
          </div>

          {monthEvents.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {monthEvents.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  locale={locale}
                  canDelete={
                    event.createdBy === viewer.profile.id ||
                    household.role !== "member"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-300">
                  <CalendarDays className="size-6" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Nog niets gepland
                </p>
                <p className="mt-1 max-w-56 text-xs leading-5 text-slate-400">
                  Voeg een afspraak toe om de agenda te vullen.
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
