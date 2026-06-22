"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/app";

const transactionSchema = z.object({
  description: z.string().trim().min(1, "Vul een omschrijving in.").max(120),
  category: z.string().trim().min(1, "Kies een categorie.").max(50),
  amount: z.coerce.number().positive("Het bedrag moet hoger zijn dan nul."),
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
      error: "Controleer de transactiegegevens.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (!isDemoMode) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
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
      return { error: "De transactie kon niet worden toegevoegd." };
    }
  }

  revalidatePath("/finances");
  revalidatePath("/dashboard");
  return {
    success: isDemoMode
      ? "Demotransactie verwerkt. Koppel Supabase om deze op te slaan."
      : "Transactie toegevoegd.",
  };
}
