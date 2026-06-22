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
  { value: "#52796F", name: "Sage" },
  { value: "#4776A8", name: "Ocean" },
  { value: "#7A62A8", name: "Lavender" },
  { value: "#B66550", name: "Terracotta" },
  { value: "#A3782B", name: "Ochre" },
  { value: "#3F7F89", name: "Teal" },
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
          label="Full name"
          error={state.fieldErrors?.fullName?.[0]}
        >
          <Input
            name="fullName"
            defaultValue={profile.fullName}
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Email address" hint="Managed by your sign-in account.">
          <Input value={profile.email} disabled />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Language & region"
          error={state.fieldErrors?.locale?.[0]}
        >
          <Select name="locale" defaultValue={profile.locale}>
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
            <option value="nl-NL">Nederlands</option>
            <option value="de-DE">Deutsch</option>
            <option value="fr-FR">Français</option>
            <option value="es-ES">Español</option>
          </Select>
        </Field>
        <Field
          label="Display currency"
          error={state.fieldErrors?.currency?.[0]}
        >
          <Select name="currency" defaultValue={profile.currency}>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="CAD">CAD — Canadian Dollar</option>
            <option value="AUD">AUD — Australian Dollar</option>
            <option value="JPY">JPY — Japanese Yen</option>
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">
          Theme color
        </legend>
        <p className="mt-1 text-xs text-slate-500">
          Used for navigation, buttons and progress indicators.
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
        <SubmitButton pendingLabel="Saving settings...">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}
