"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getFinancialAgendaData, getViewer } from "@/lib/data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  FinancialAgendaItem,
} from "@/types/app";

const agendaItemSchema = z.object({
  title: z.string().trim().min(1, "Vul een omschrijving in.").max(120),
  category: z.string().trim().min(1, "Kies een categorie.").max(50),
  amount: z.coerce.number().positive("Het bedrag moet hoger zijn dan nul."),
  type: z.enum(["income", "expense"]),
  dueDate: z.iso.date(),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]),
  assignedTo: z.string().min(1, "Kies een huishoudlid."),
});

export async function createFinancialAgendaItemAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = agendaItemSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    dueDate: formData.get("dueDate"),
    recurrence: formData.get("recurrence"),
    assignedTo: formData.get("assignedTo"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gegevens van de agendapost.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const agendaData = await getFinancialAgendaData(viewer);
    const assignedMember = agendaData.members.find(
      (member) => member.id === parsed.data.assignedTo,
    );

    if (!assignedMember) {
      return { error: "Het gekozen huishoudlid bestaat niet." };
    }

    const cookieStore = await cookies();
    const items = JSON.parse(
      cookieStore.get("nestly_demo_financial_agenda")?.value || "[]",
    ) as FinancialAgendaItem[];
    items.push({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      category: parsed.data.category,
      amount: parsed.data.amount,
      type: parsed.data.type,
      dueDate: parsed.data.dueDate,
      recurrence: parsed.data.recurrence,
      assignedTo: parsed.data.assignedTo,
      assignedToName: assignedMember.name,
      createdBy: viewer.profile.id,
    });
    cookieStore.set("nestly_demo_financial_agenda", JSON.stringify(items), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { data: assignedMember } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", viewer.household.id)
      .eq("user_id", parsed.data.assignedTo)
      .maybeSingle();

    if (!assignedMember) {
      return { error: "Het gekozen huishoudlid bestaat niet." };
    }

    const { error } = await supabase.from("financial_agenda_items").insert({
      household_id: viewer.household.id,
      title: parsed.data.title,
      category: parsed.data.category,
      amount: parsed.data.amount,
      type: parsed.data.type,
      due_date: parsed.data.dueDate,
      recurrence: parsed.data.recurrence,
      assigned_to: parsed.data.assignedTo,
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: "De agendapost kon niet worden toegevoegd." };
    }
  }

  revalidatePath("/finances/agenda");
  return { success: "Agendapost toegevoegd." };
}
