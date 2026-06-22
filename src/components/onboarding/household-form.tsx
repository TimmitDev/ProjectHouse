"use client";

import { Home, KeyRound, UsersRound } from "lucide-react";
import { useActionState, useState } from "react";

import {
  createHouseholdAction,
  joinHouseholdAction,
} from "@/actions/household";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types/app";

const initialState: ActionState = {};

export function HouseholdForm() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [createState, createAction] = useActionState(
    createHouseholdAction,
    initialState,
  );
  const [joinState, joinAction] = useActionState(
    joinHouseholdAction,
    initialState,
  );
  const state = mode === "create" ? createState : joinState;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {[
          { key: "create" as const, label: "Create", icon: Home },
          { key: "join" as const, label: "Join", icon: UsersRound },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key)}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition",
              mode === item.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </div>

      <ActionMessage error={state.error} />

      {mode === "create" ? (
        <form action={createAction} className="mt-4 space-y-4">
          <Field
            label="Household name"
            error={createState.fieldErrors?.householdName?.[0]}
          >
            <Input
              name="householdName"
              placeholder="The Morgan Home"
              autoFocus
              required
            />
          </Field>
          <Field
            label="Default currency"
            error={createState.fieldErrors?.currency?.[0]}
          >
            <Select name="currency" defaultValue="EUR">
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="AUD">AUD — Australian Dollar</option>
              <option value="JPY">JPY — Japanese Yen</option>
            </Select>
          </Field>
          <SubmitButton
            className="w-full"
            size="lg"
            pendingLabel="Creating household..."
          >
            Create household
          </SubmitButton>
        </form>
      ) : (
        <form action={joinAction} className="mt-4 space-y-4">
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_20%,white)] bg-[color-mix(in_srgb,var(--accent)_7%,white)] p-3.5 text-sm leading-5 text-slate-600">
            Ask a household admin for the invite code. Codes are not
            case-sensitive.
          </div>
          <Field
            label="Household invite code"
            error={joinState.fieldErrors?.inviteCode?.[0]}
          >
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
              <Input
                name="inviteCode"
                placeholder="NEST-4821"
                className="pl-10 uppercase tracking-[0.12em]"
                autoFocus
                required
              />
            </div>
          </Field>
          <SubmitButton
            className="w-full"
            size="lg"
            pendingLabel="Joining household..."
          >
            Join household
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
