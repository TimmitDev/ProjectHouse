"use client";

import { Plus, TrendingUp } from "lucide-react";
import { useActionState, useState } from "react";

import {
  contributeToGoalAction,
  createGoalAction,
} from "@/actions/goals";
import { Button } from "@/components/ui/button";
import {
  ActionMessage,
  Field,
  Input,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import type { ActionState } from "@/types/app";

const initialState: ActionState = {};

export function CreateGoalButton() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createGoalAction, initialState);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New goal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a savings goal"
        description="Give your household something concrete to work towards."
      >
        <form action={action} className="space-y-4">
          <ActionMessage error={state.error} success={state.success} />
          <Field label="Goal name" error={state.fieldErrors?.name?.[0]}>
            <Input name="name" placeholder="Summer getaway" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Target amount"
              error={state.fieldErrors?.targetAmount?.[0]}
            >
              <Input
                name="targetAmount"
                type="number"
                min="1"
                step="0.01"
                placeholder="5000"
                required
              />
            </Field>
            <Field
              label="Already saved"
              error={state.fieldErrors?.currentAmount?.[0]}
            >
              <Input
                name="currentAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </Field>
          </div>
          <Field label="Target date" error={state.fieldErrors?.deadline?.[0]}>
            <Input name="deadline" type="date" />
          </Field>
          <Field label="Color" error={state.fieldErrors?.color?.[0]}>
            <div className="flex flex-wrap gap-3">
              {[
                "#52796F",
                "#4776A8",
                "#7A62A8",
                "#B66550",
                "#A3782B",
                "#3F7F89",
              ].map((color, index) => (
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
              Cancel
            </Button>
            <SubmitButton pendingLabel="Creating...">
              Create goal
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ContributeButton({
  goalId,
  goalName,
}: {
  goalId: string;
  goalName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    contributeToGoalAction,
    initialState,
  );

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <TrendingUp className="size-4" />
        Add contribution
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add to ${goalName}`}
        description="Record money your household has put towards this goal."
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="goalId" value={goalId} />
          <ActionMessage error={state.error} success={state.success} />
          <Field
            label="Contribution amount"
            error={state.fieldErrors?.amount?.[0]}
          >
            <Input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="250"
              autoFocus
              required
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Adding...">Add amount</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
