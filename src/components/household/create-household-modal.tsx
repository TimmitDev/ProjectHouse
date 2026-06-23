"use client";

import { useActionState } from "react";

import { createAdditionalHouseholdAction } from "@/actions/household";
import { Button } from "@/components/ui/button";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import type { ActionState } from "@/types/app";

const initialState: ActionState = {};

export function CreateHouseholdModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [createState, createAction] = useActionState(
    createAdditionalHouseholdAction,
    initialState,
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Een nieuw thuis"
      description="Maak een extra huishouden. Je wordt automatisch eigenaar en schakelt er direct naartoe."
    >
      <form action={createAction} className="space-y-4">
        <ActionMessage
          error={createState.error}
          success={createState.success}
        />
        <Field
          label="Naam van het huishouden"
          error={createState.fieldErrors?.householdName?.[0]}
        >
          <Input
            name="householdName"
            placeholder="Bijvoorbeeld Het Strandhuis"
            autoFocus
            required
          />
        </Field>
        <Field
          label="Standaardvaluta"
          error={createState.fieldErrors?.currency?.[0]}
        >
          <Select name="currency" defaultValue="EUR">
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Amerikaanse dollar</option>
            <option value="GBP">GBP — Britse pond</option>
            <option value="CAD">CAD — Canadese dollar</option>
            <option value="AUD">AUD — Australische dollar</option>
            <option value="JPY">JPY — Japanse yen</option>
          </Select>
        </Field>
        <div className="rounded-xl bg-emerald-50 px-3.5 py-3 text-xs leading-5 text-emerald-800">
          Financiën staat direct aan. Andere modules kun je daarna per
          huishouden activeren.
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Annuleren
          </Button>
          <SubmitButton pendingLabel="Thuis aanmaken...">
            Huishouden aanmaken
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
