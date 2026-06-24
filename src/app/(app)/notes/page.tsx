import {
  AlertTriangle,
  Home,
  NotebookText,
  Pin,
  ReceiptText,
  ShoppingBasket,
  StickyNote,
  Tags,
  UserRound,
  WalletCards,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AddNoteButton } from "@/components/notes/note-form";
import { NoteActionButtons } from "@/components/notes/note-actions";
import { Card, PageHeader } from "@/components/ui/card";
import { getHouseholdNotes, getViewer } from "@/lib/data";
import { cn, formatDate } from "@/lib/utils";
import type {
  HouseholdNote,
  HouseholdNoteCategory,
} from "@/types/app";

export const metadata: Metadata = { title: "Notities" };

const categoryConfig = {
  general: {
    label: "Algemeen",
    icon: StickyNote,
    color: "bg-slate-100 text-slate-700",
  },
  home: {
    label: "Thuis",
    icon: Home,
    color: "bg-emerald-50 text-emerald-700",
  },
  finance: {
    label: "Financien",
    icon: WalletCards,
    color: "bg-sky-50 text-sky-700",
  },
  shopping: {
    label: "Boodschappen",
    icon: ShoppingBasket,
    color: "bg-orange-50 text-orange-700",
  },
  maintenance: {
    label: "Onderhoud",
    icon: Wrench,
    color: "bg-amber-50 text-amber-700",
  },
  important: {
    label: "Belangrijk",
    icon: AlertTriangle,
    color: "bg-red-50 text-red-700",
  },
  other: {
    label: "Overig",
    icon: NotebookText,
    color: "bg-stone-100 text-stone-700",
  },
} satisfies Record<
  HouseholdNoteCategory,
  { label: string; icon: typeof StickyNote; color: string }
>;

function StatCard({
  label,
  value,
  meta,
  icon: Icon,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof StickyNote;
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

function NoteCard({
  note,
  locale,
  canDelete,
}: {
  note: HouseholdNote;
  locale: string;
  canDelete: boolean;
}) {
  const category = categoryConfig[note.category];
  const Icon = category.icon;

  return (
    <Card
      className={cn(
        "flex min-h-64 flex-col p-5 sm:p-6",
        note.pinned && "border-[color-mix(in_srgb,var(--accent)_28%,white)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
            category.color,
          )}
        >
          <Icon className="size-3.5" />
          {category.label}
        </span>
        <NoteActionButtons
          id={note.id}
          title={note.title}
          pinned={note.pinned}
          canDelete={canDelete}
        />
      </div>

      <div className="mt-5 min-w-0">
        <div className="flex items-center gap-2">
          {note.pinned && <Pin className="size-4 text-[var(--accent)]" />}
          <h2 className="truncate font-semibold tracking-[-0.02em] text-slate-900">
            {note.title}
          </h2>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
          {note.body}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-6 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
          <UserRound className="size-3" />
          {note.createdByName}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
          Bijgewerkt {formatDate(note.updatedAt, locale)}
        </span>
      </div>
    </Card>
  );
}

export default async function NotesPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("notes")) redirect("/modules");
  const household = viewer.household;
  const notes = await getHouseholdNotes(viewer);
  const pinnedNotes = notes.filter((note) => note.pinned);
  const otherNotes = notes.filter((note) => !note.pinned);
  const categoryCount = new Set(notes.map((note) => note.category)).size;
  const latestNote = notes[0];
  const canManageAll = household.role !== "member";
  const { locale } = viewer.profile;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Samen onthouden"
        title="Notities"
        description={`Huisinfo en korte afspraken voor ${household.name}.`}
        actions={<AddNoteButton />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Notities"
          value={`${notes.length}`}
          meta="Totaal opgeslagen"
          icon={NotebookText}
        />
        <StatCard
          label="Vastgezet"
          value={`${pinnedNotes.length}`}
          meta="Altijd bovenaan"
          icon={Pin}
        />
        <StatCard
          label="Categorieen"
          value={`${categoryCount}`}
          meta="Gebruikt in dit huishouden"
          icon={Tags}
        />
        <StatCard
          label="Laatst bijgewerkt"
          value={latestNote ? formatDate(latestNote.updatedAt, locale) : "Geen"}
          meta={latestNote?.title ?? "Nog niets opgeslagen"}
          icon={ReceiptText}
        />
      </section>

      {notes.length ? (
        <section className="space-y-5">
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Vastgezet
              </h2>
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    locale={locale}
                    canDelete={canManageAll || note.createdBy === viewer.profile.id}
                  />
                ))}
              </div>
            </div>
          )}

          {otherNotes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Overige notities
              </h2>
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    locale={locale}
                    canDelete={canManageAll || note.createdBy === viewer.profile.id}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <Card className="grid min-h-80 place-items-center p-8 text-center">
          <div>
            <NotebookText className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              Nog geen notities
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Voeg huisinfo of afspraken toe zodat iedereen ze kan terugvinden.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
