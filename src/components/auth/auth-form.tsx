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
        hint={!isLogin ? "Use at least 8 characters." : undefined}
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

      {isLogin && (
        <div className="flex justify-end">
          <span className="text-xs text-slate-400">
            Password reset via Supabase Auth
          </span>
        </div>
      )}

      <SubmitButton
        className="w-full"
        size="lg"
        pendingLabel={isLogin ? "Signing in..." : "Creating account..."}
      >
        {isLogin ? "Sign in" : "Create my account"}
      </SubmitButton>

      <p className="pt-1 text-center text-sm text-slate-500">
        {isLogin ? "New to Nestly?" : "Already have an account?"}{" "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
