"use client";

import { ClipboardPlus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createChoreAction } from "@/actions/chores";
import { Button } from "@/components/ui/button";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import type {
  ActionState,
  ChoreArea,
  ChoreFrequency,
  HouseholdMember,
} from "@/types/app";

const initialState: ActionState = {};

const areaOptions: Array<{ value: ChoreArea; label: string }> = [
  { value: "kitchen", label: "Keuken" },
  { value: "bathroom", label: "Badkamer" },
  { value: "living", label: "Woonkamer" },
  { value: "bedroom", label: "Slaapkamer" },
  { value: "outside", label: "Buiten" },
  { value: "admin", label: "Administratie" },
  { value: "other", label: "Overig" },
];

const frequencyOptions: Array<{ value: ChoreFrequency; label: string }> = [
  { value: "once", label: "Eenmalig" },
  { value: "daily", label: "Dagelijks" },
  { value: "weekly", label: "Wekelijks" },
  { value: "biweekly", label: "Elke twee weken" },
  { value: "monthly", label: "Maandelijks" },
];

export function AddChoreButton({ members }: { members: HouseholdMember[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createChoreAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <ClipboardPlus className="size-4" />
        Taak toevoegen
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Taak toevoegen"
        description="Maak een huishoudelijke taak aan en wijs hem eventueel toe."
      >
        <form ref={formRef} action={action} className="space-y-4">
          <ActionMessage error={state.error} success={state.success} />
          <Field label="Taak" error={state.fieldErrors?.title?.[0]}>
            <Input name="title" placeholder="Bijvoorbeeld keuken opruimen" required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ruimte" error={state.fieldErrors?.area?.[0]}>
              <Select name="area" defaultValue="kitchen">
                {areaOptions.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Herhaling"
              error={state.fieldErrors?.frequency?.[0]}
            >
              <Select name="frequency" defaultValue="weekly">
                {frequencyOptions.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deadline" error={state.fieldErrors?.dueDate?.[0]}>
              <Input
                name="dueDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
            <Field
              label="Toegewezen aan"
              error={state.fieldErrors?.assignedTo?.[0]}
            >
              <Select name="assignedTo" defaultValue="">
                <option value="">Iedereen</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

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
              Taak toevoegen
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

