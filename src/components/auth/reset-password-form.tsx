"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/actions/settings";
import {
  ActionMessage,
  Field,
  Input,
  SubmitButton,
} from "@/components/ui/form-controls";
import type { ActionState } from "@/types/app";

const initialState: ActionState = {};

export function ResetPasswordForm() {
  const [state, action] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-4">
      <ActionMessage error={state.error} success={state.success} />
      <Field
        label="Nieuw wachtwoord"
        error={state.fieldErrors?.password?.[0]}
      >
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      <Field
        label="Herhaal wachtwoord"
        error={state.fieldErrors?.passwordConfirmation?.[0]}
      >
        <Input
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      <SubmitButton
        className="w-full bg-black text-white hover:bg-zinc-800"
        size="lg"
        pendingLabel="Wachtwoord opslaan..."
      >
        Nieuw wachtwoord opslaan
      </SubmitButton>
    </form>
  );
}
