"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { createTransactionAction } from "@/actions/transactions";
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

export function AddTransactionButton() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    createTransactionAction,
    initialState,
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add transaction
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a transaction"
        description="Record shared income or spending for your household."
      >
        <form action={action} className="space-y-4">
          <ActionMessage error={state.error} success={state.success} />
          <Field
            label="Description"
            error={state.fieldErrors?.description?.[0]}
          >
            <Input name="description" placeholder="Grocery run" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" error={state.fieldErrors?.type?.[0]}>
              <Select name="type" defaultValue="expense">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </Field>
            <Field label="Amount" error={state.fieldErrors?.amount?.[0]}>
              <Input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={state.fieldErrors?.category?.[0]}>
              <Select name="category" defaultValue="Groceries">
                <option>Groceries</option>
                <option>Housing</option>
                <option>Utilities</option>
                <option>Transport</option>
                <option>Dining</option>
                <option>Income</option>
                <option>Savings</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="Date" error={state.fieldErrors?.transactionDate?.[0]}>
              <Input
                name="transactionDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Adding...">
              Add transaction
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
