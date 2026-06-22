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
          label="Full name"
          error={state.fieldErrors?.fullName?.[0]}
        >
          <Input
            name="fullName"
            autoComplete="name"
            placeholder="Alex Morgan"
            required
          />
        </Field>
      )}

      <Field label="Email address" error={state.fieldErrors?.email?.[0]}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field
        label="Password"
        error={state.fieldErrors?.password?.[0]}
      >
        <div className="relative">
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="At least 8 characters"
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
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
        pendingLabel={isLogin ? "Signing in..." : "Creating account..."}
      >
        {isLogin ? "Sign in" : "Create account"}
      </SubmitButton>

      <p className="pt-2 text-center text-sm text-zinc-500">
        {isLogin ? "No account?" : "Already registered?"}{" "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-black underline-offset-4 hover:underline"
        >
          {isLogin ? "Register" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
