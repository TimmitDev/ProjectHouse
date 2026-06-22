"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";

import { updateSettingsAction } from "@/actions/settings";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import type { ActionState, Profile } from "@/types/app";

const initialState: ActionState = {};

const colors = [
  { value: "#52796F", name: "Salie" },
  { value: "#4776A8", name: "Oceaan" },
  { value: "#7A62A8", name: "Lavendel" },
  { value: "#B66550", name: "Terracotta" },
  { value: "#A3782B", name: "Oker" },
  { value: "#3F7F89", name: "Blauwgroen" },
];

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(
    updateSettingsAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-7">
      <ActionMessage error={state.error} success={state.success} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Volledige naam"
          error={state.fieldErrors?.fullName?.[0]}
        >
          <Input
            name="fullName"
            defaultValue={profile.fullName}
            autoComplete="name"
            required
          />
        </Field>
        <Field
          label="E-mailadres"
          hint="Bij wijziging ontvang je een bevestigingsmail."
          error={state.fieldErrors?.email?.[0]}
        >
          <Input
            name="email"
            type="email"
            defaultValue={profile.email}
            autoComplete="email"
            required
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Taal en regio"
          error={state.fieldErrors?.locale?.[0]}
        >
          <Select name="locale" defaultValue={profile.locale}>
            <option value="en-US">Engels (Verenigde Staten)</option>
            <option value="en-GB">Engels (Verenigd Koninkrijk)</option>
            <option value="nl-NL">Nederlands</option>
            <option value="de-DE">Duits</option>
            <option value="fr-FR">Frans</option>
            <option value="es-ES">Spaans</option>
          </Select>
        </Field>
        <Field
          label="Weergavevaluta"
          error={state.fieldErrors?.currency?.[0]}
        >
          <Select name="currency" defaultValue={profile.currency}>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Amerikaanse dollar</option>
            <option value="GBP">GBP — Britse pond</option>
            <option value="CAD">CAD — Canadese dollar</option>
            <option value="AUD">AUD — Australische dollar</option>
            <option value="JPY">JPY — Japanse yen</option>
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">
          Themakleur
        </legend>
        <p className="mt-1 text-xs text-slate-500">
          Wordt gebruikt voor navigatie, knoppen en voortgangsbalken.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {colors.map((color) => (
            <label key={color.value} className="cursor-pointer">
              <input
                type="radio"
                name="accentColor"
                value={color.value}
                defaultChecked={profile.accentColor === color.value}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "relative flex aspect-square items-end rounded-xl border-2 border-white p-2 shadow-sm ring-2 ring-transparent transition peer-checked:ring-slate-400",
                )}
                style={{ backgroundColor: color.value }}
              >
                <span className="text-[10px] font-medium text-white/90">
                  {color.name}
                </span>
                <Check className="absolute right-2 top-2 size-4 text-white opacity-0 peer-checked:opacity-100" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end border-t border-slate-100 pt-6">
        <SubmitButton pendingLabel="Instellingen opslaan...">
          Wijzigingen opslaan
        </SubmitButton>
      </div>
    </form>
  );
}
