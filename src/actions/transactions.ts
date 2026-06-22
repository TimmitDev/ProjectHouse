"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/app";

const transactionSchema = z.object({
  description: z.string().trim().min(1, "Enter a description.").max(120),
  category: z.string().trim().min(1, "Choose a category.").max(50),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  type: z.enum(["income", "expense"]),
  transactionDate: z.iso.date(),
});

export async function createTransactionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse({
    description: formData.get("description"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    transactionDate: formData.get("transactionDate"),
  });

  if (!parsed.success) {
    return {
      error: "Please check the transaction details.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "No household found." };
  }

  if (!isDemoMode) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("transactions").insert({
      household_id: viewer.household.id,
      description: parsed.data.description,
      category: parsed.data.category,
      amount: parsed.data.amount,
      type: parsed.data.type,
      transaction_date: parsed.data.transactionDate,
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/finances");
  revalidatePath("/dashboard");
  return {
    success: isDemoMode
      ? "Demo transaction accepted. Connect Supabase to persist it."
      : "Transaction added.",
  };
}
