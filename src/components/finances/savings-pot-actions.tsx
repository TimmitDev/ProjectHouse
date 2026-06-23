"use client";

import { Minus, Plus, Trash2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  adjustSavingsPotAction,
  createSavingsPotAction,
  deleteSavingsPotAction,
} from "@/actions/savings-pots";
import { Button } from "@/components/ui/button";
import {
  ActionMessage,
  Field,
  Input,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { cn, formatCurrency } from "@/lib/utils";
import type { ActionState, SavingsPot } from "@/types/app";

const initialState: ActionState = {};
const colors = [
  "#52796F",
  "#4776A8",
  "#7A62A8",
  "#B66550",
  "#A3782B",
  "#3F7F89",
];

export function CreateSavingsPotButton() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    createSavingsPotAction,
    initialState,
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nieuw potje
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Spaarpotje maken"
        description="Maak een flexibel potje waar je later ook weer geld uit kunt opnemen."
      >
        <form action={action} className="space-y-4">
          <ActionMessage error={state.error} success={state.success} />
          <Field
            label="Naam van het potje"
            error={state.fieldErrors?.name?.[0]}
          >
            <Input name="name" placeholder="Huishoudbuffer" required />
          </Field>
          <Field
            label="Waar is dit potje voor?"
            error={state.fieldErrors?.description?.[0]}
          >
            <Input
              name="description"
              placeholder="Bijvoorbeeld onverwachte reparaties"
            />
          </Field>
          <Field
            label="Doelbedrag"
            hint="Optioneel — een potje mag ook zonder einddoel."
            error={state.fieldErrors?.targetAmount?.[0]}
          >
            <Input
              name="targetAmount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="3000"
            />
          </Field>
          <Field label="Kleur" error={state.fieldErrors?.color?.[0]}>
            <div className="flex flex-wrap gap-3">
              {colors.map((color, index) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                  />
                  <span
                    className="block size-8 rounded-full border-2 border-white shadow-sm ring-2 ring-transparent transition peer-checked:ring-slate-400"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton pendingLabel="Aanmaken...">
              Potje aanmaken
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ManageSavingsPotButton({
  pot,
  currency,
  locale,
}: {
  pot: SavingsPot;
  currency: string;
  locale: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"deposit" | "withdraw">(
    "deposit",
  );
  const [state, action] = useActionState(
    adjustSavingsPotAction,
    initialState,
  );
  const [deleting, startDeleting] = useTransition();

  function removePot() {
    if (
      !window.confirm(
        `Weet je zeker dat je "${pot.name}" en de historie wilt verwijderen?`,
      )
    ) {
      return;
    }

    startDeleting(async () => {
      const result = await deleteSavingsPotAction(pot.id);
      if (!result.error) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Wallet className="size-4" />
        Potje beheren
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={pot.name}
        description={`Er staat nu ${formatCurrency(
          pot.currentAmount,
          currency,
          locale,
        )} in dit potje.`}
      >
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          {[
            { value: "deposit" as const, label: "Toevoegen", icon: Plus },
            { value: "withdraw" as const, label: "Opnemen", icon: Minus },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDirection(option.value)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition",
                direction === option.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <option.icon className="size-4" />
              {option.label}
            </button>
          ))}
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="potId" value={pot.id} />
          <input type="hidden" name="direction" value={direction} />
          <ActionMessage error={state.error} success={state.success} />
          <Field
            label={
              direction === "deposit"
                ? "Hoeveel wil je toevoegen?"
                : "Hoeveel wil je opnemen?"
            }
            error={state.fieldErrors?.amount?.[0]}
          >
            <Input
              key={direction}
              name="amount"
              type="number"
              min="0.01"
              max={
                direction === "withdraw"
                  ? Math.max(0, pot.currentAmount)
                  : undefined
              }
              step="0.01"
              placeholder="100"
              autoFocus
              required
            />
          </Field>
          <Field
            label="Notitie"
            hint="Optioneel, bijvoorbeeld 'maandelijkse inleg'."
            error={state.fieldErrors?.note?.[0]}
          >
            <Input name="note" maxLength={120} />
          </Field>
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={removePot}
              disabled={deleting}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="size-4" />
              {deleting ? "Verwijderen..." : "Verwijderen"}
            </Button>
            <SubmitButton
              pendingLabel={
                direction === "deposit" ? "Toevoegen..." : "Opnemen..."
              }
            >
              {direction === "deposit" ? "Geld toevoegen" : "Geld opnemen"}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
