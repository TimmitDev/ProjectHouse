"use client";

import { CalendarPlus } from "lucide-react";
import { useActionState, useState } from "react";

import { createFinancialAgendaItemAction } from "@/actions/financial-agenda";
import { Button } from "@/components/ui/button";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import type { ActionState, HouseholdMember } from "@/types/app";

const initialState: ActionState = {};

export function AddFinancialAgendaItemButton({
  members,
  viewerId,
}: {
  members: HouseholdMember[];
  viewerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    createFinancialAgendaItemAction,
    initialState,
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <CalendarPlus className="size-4" />
        Bedrag plannen
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Bedrag inplannen"
        description="Voeg een eenmalige of terugkerende inkomst of uitgave toe."
      >
        <form action={action} className="space-y-4">
          <ActionMessage error={state.error} success={state.success} />
          <Field label="Omschrijving" error={state.fieldErrors?.title?.[0]}>
            <Input
              name="title"
              placeholder="Bijvoorbeeld huur of salaris"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" error={state.fieldErrors?.type?.[0]}>
              <Select name="type" defaultValue="expense">
                <option value="expense">Uitgave</option>
                <option value="income">Inkomst</option>
              </Select>
            </Field>
            <Field label="Bedrag" error={state.fieldErrors?.amount?.[0]}>
              <Input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categorie" error={state.fieldErrors?.category?.[0]}>
              <Select name="category" defaultValue="Vaste lasten">
                <option>Boodschappen</option>
                <option>Wonen</option>
                <option>Vaste lasten</option>
                <option>Vervoer</option>
                <option>Uit eten</option>
                <option>Inkomsten</option>
                <option>Sparen</option>
                <option>Overig</option>
              </Select>
            </Field>
            <Field label="Eerste datum" error={state.fieldErrors?.dueDate?.[0]}>
              <Input
                name="dueDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Herhaling"
              error={state.fieldErrors?.recurrence?.[0]}
            >
              <Select name="recurrence" defaultValue="none">
                <option value="none">Eenmalig</option>
                <option value="weekly">Wekelijks</option>
                <option value="monthly">Maandelijks</option>
                <option value="yearly">Jaarlijks</option>
              </Select>
            </Field>
            <Field
              label="Van wie is dit?"
              error={state.fieldErrors?.assignedTo?.[0]}
            >
              <Select name="assignedTo" defaultValue={viewerId}>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Voor welke maand telt dit bedrag?"
            error={state.fieldErrors?.budgetMonthOffset?.[0]}
            hint="Handig voor salaris dat aan het einde van de vorige maand wordt uitbetaald."
          >
            <Select name="budgetMonthOffset" defaultValue="0">
              <option value="0">De maand van de betaaldatum</option>
              <option value="1">De volgende maand</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton pendingLabel="Inplannen...">
              Bedrag inplannen
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
