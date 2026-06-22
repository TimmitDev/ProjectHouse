"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { loginAction, registerAction } from "@/actions/auth";
import {
  ActionMessage,
  Field,
  Input,
  SubmitButton,
} from "@/components/ui/form-controls";
import type { ActionState } from "@/types/app";

const initialState: ActionState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-4">
      <ActionMessage error={state.error} />

      {!isLogin && (
        <Field
          label="Volledige naam"
          error={state.fieldErrors?.fullName?.[0]}
        >
          <Input
            name="fullName"
            autoComplete="name"
            placeholder="Alex Jansen"
            required
          />
        </Field>
      )}

      <Field label="E-mailadres" error={state.fieldErrors?.email?.[0]}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jij@voorbeeld.nl"
          required
        />
      </Field>

      <Field
        label="Wachtwoord"
        error={state.fieldErrors?.password?.[0]}
      >
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="Minimaal 8 tekens"
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label={showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </Field>

      <SubmitButton
        className="w-full bg-black text-white hover:bg-zinc-800"
        size="lg"
        pendingLabel={isLogin ? "Bezig met inloggen..." : "Account aanmaken..."}
      >
        {isLogin ? "Inloggen" : "Account aanmaken"}
      </SubmitButton>

      <p className="pt-2 text-center text-sm text-zinc-500">
        {isLogin ? "Nog geen account?" : "Al een account?"}{" "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-black underline-offset-4 hover:underline"
        >
          {isLogin ? "Registreren" : "Inloggen"}
        </Link>
      </p>
    </form>
  );
}
