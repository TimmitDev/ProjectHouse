"use client";

import { CalendarPlus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createCalendarEventAction } from "@/actions/calendar";
import { Button } from "@/components/ui/button";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { ActionState, CalendarEventCategory } from "@/types/app";

const initialState: ActionState = {};

const categoryOptions: Array<{
  value: CalendarEventCategory;
  label: string;
}> = [
  { value: "home", label: "Thuis" },
  { value: "appointment", label: "Afspraak" },
  { value: "school", label: "School" },
  { value: "work", label: "Werk" },
  { value: "social", label: "Sociaal" },
  { value: "health", label: "Gezondheid" },
  { value: "travel", label: "Reizen" },
  { value: "other", label: "Overig" },
];

export function AddCalendarEventButton() {
  const [open, setOpen] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [state, action] = useActionState(
    createCalendarEventAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <CalendarPlus className="size-4" />
        Afspraak toevoegen
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Afspraak toevoegen"
        description="Zet een afspraak in de gedeelde agenda van je huishouden."
      >
        <form ref={formRef} action={action} className="space-y-4">
          <ActionMessage error={state.error} success={state.success} />
          <Field label="Titel" error={state.fieldErrors?.title?.[0]}>
            <Input
              name="title"
              placeholder="Bijvoorbeeld tandarts of verjaardag"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Datum" error={state.fieldErrors?.eventDate?.[0]}>
              <Input
                name="eventDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
            <Field label="Categorie" error={state.fieldErrors?.category?.[0]}>
              <Select name="category" defaultValue="appointment">
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="allDay"
              checked={allDay}
              onChange={(event) => setAllDay(event.target.checked)}
              className="size-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Hele dag
          </label>

          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2",
              allDay && "pointer-events-none opacity-45",
            )}
          >
            <Field
              label="Begintijd"
              error={state.fieldErrors?.startTime?.[0]}
            >
              <Input
                name="startTime"
                type="time"
                defaultValue="09:00"
                disabled={allDay}
                required={!allDay}
              />
            </Field>
            <Field label="Eindtijd" error={state.fieldErrors?.endTime?.[0]}>
              <Input name="endTime" type="time" disabled={allDay} />
            </Field>
          </div>

          <Field label="Locatie" error={state.fieldErrors?.location?.[0]}>
            <Input name="location" placeholder="Optioneel" />
          </Field>

          <Field
            label="Omschrijving"
            error={state.fieldErrors?.description?.[0]}
          >
            <textarea
              name="description"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
              placeholder="Optioneel"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton pendingLabel="Toevoegen...">
              Afspraak toevoegen
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
