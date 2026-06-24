"use client";

import { NotebookPen } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createNoteAction } from "@/actions/notes";
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
  HouseholdNoteCategory,
} from "@/types/app";

const initialState: ActionState = {};

const categoryOptions: Array<{
  value: HouseholdNoteCategory;
  label: string;
}> = [
  { value: "general", label: "Algemeen" },
  { value: "home", label: "Thuis" },
  { value: "finance", label: "Financien" },
  { value: "shopping", label: "Boodschappen" },
  { value: "maintenance", label: "Onderhoud" },
  { value: "important", label: "Belangrijk" },
  { value: "other", label: "Overig" },
];

export function AddNoteButton() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createNoteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <NotebookPen className="size-4" />
        Notitie toevoegen
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Notitie toevoegen"
        description="Bewaar huisinfo, afspraken of een kort geheugensteuntje."
      >
        <form ref={formRef} action={action} className="space-y-4">
          <ActionMessage error={state.error} success={state.success} />
          <Field label="Titel" error={state.fieldErrors?.title?.[0]}>
            <Input name="title" placeholder="Bijvoorbeeld wifi of onderhoud" required />
          </Field>
          <Field label="Categorie" error={state.fieldErrors?.category?.[0]}>
            <Select name="category" defaultValue="general">
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notitie" error={state.fieldErrors?.body?.[0]}>
            <textarea
              name="body"
              rows={6}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
              placeholder="Schrijf hier wat iedereen moet kunnen terugvinden."
              required
            />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="pinned"
              className="size-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Bovenaan vastzetten
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton pendingLabel="Opslaan...">
              Notitie opslaan
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

