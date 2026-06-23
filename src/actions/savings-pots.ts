"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { demoSavingsPots } from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  SavingsPot,
  SavingsPotEntry,
} from "@/types/app";

const potSchema = z.object({
  name: z.string().trim().min(2, "Geef het potje een naam.").max(80),
  description: z.string().trim().max(180).default(""),
  targetAmount: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().positive("Het doelbedrag moet hoger zijn dan nul.").optional(),
  ),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#52796F"),
});

const adjustmentSchema = z.object({
  potId: z.string().min(1),
  direction: z.enum(["deposit", "withdraw"]),
  amount: z.coerce.number().positive("Vul een bedrag hoger dan nul in."),
  note: z.string().trim().max(120).default(""),
});

type DemoSavingsPots = Record<string, SavingsPot[]>;

async function getDemoPots() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("nestly_demo_savings_pots")?.value;

  if (!raw) return { cookieStore, potsByHousehold: {} as DemoSavingsPots };

  try {
    return {
      cookieStore,
      potsByHousehold: JSON.parse(raw) as DemoSavingsPots,
    };
  } catch {
    return { cookieStore, potsByHousehold: {} as DemoSavingsPots };
  }
}

function getDemoPotList(
  potsByHousehold: DemoSavingsPots,
  householdId: string,
) {
  return potsByHousehold[householdId]
    ? [...potsByHousehold[householdId]]
    : demoSavingsPots.map((pot) => ({
        ...pot,
        recentEntries: pot.recentEntries.map((entry) => ({ ...entry })),
      }));
}

function saveDemoPots(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  potsByHousehold: DemoSavingsPots,
) {
  cookieStore.set(
    "nestly_demo_savings_pots",
    JSON.stringify(potsByHousehold),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
}

export async function createSavingsPotAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = potSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    targetAmount: formData.get("targetAmount"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gegevens van het spaarpotje.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, potsByHousehold } = await getDemoPots();
    const pots = getDemoPotList(potsByHousehold, viewer.household.id);
    pots.unshift({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      description: parsed.data.description,
      targetAmount: parsed.data.targetAmount ?? null,
      currentAmount: 0,
      color: parsed.data.color,
      createdBy: viewer.profile.id,
      createdAt: new Date().toISOString(),
      recentEntries: [],
    });
    potsByHousehold[viewer.household.id] = pots;
    saveDemoPots(cookieStore, potsByHousehold);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("savings_pots").insert({
      household_id: viewer.household.id,
      name: parsed.data.name,
      description: parsed.data.description,
      target_amount: parsed.data.targetAmount ?? null,
      color: parsed.data.color,
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: "Het spaarpotje kon niet worden aangemaakt." };
    }
  }

  revalidatePath("/finances/pots");
  return { success: "Spaarpotje aangemaakt." };
}

export async function adjustSavingsPotAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = adjustmentSchema.safeParse({
    potId: formData.get("potId"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    note: formData.get("note") || "",
  });

  if (!parsed.success) {
    return {
      error: "Controleer het bedrag.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  const signedAmount =
    parsed.data.direction === "deposit"
      ? parsed.data.amount
      : -parsed.data.amount;

  if (isDemoMode) {
    const { cookieStore, potsByHousehold } = await getDemoPots();
    const pots = getDemoPotList(potsByHousehold, viewer.household.id);
    const pot = pots.find((item) => item.id === parsed.data.potId);

    if (!pot) return { error: "Spaarpotje niet gevonden." };
    if (pot.currentAmount + signedAmount < 0) {
      return { error: "Er staat niet genoeg geld in dit spaarpotje." };
    }

    const entry: SavingsPotEntry = {
      id: crypto.randomUUID(),
      amount: signedAmount,
      note: parsed.data.note,
      createdBy: viewer.profile.id,
      createdAt: new Date().toISOString(),
    };
    pot.currentAmount += signedAmount;
    pot.recentEntries = [entry, ...pot.recentEntries].slice(0, 3);
    potsByHousehold[viewer.household.id] = pots;
    saveDemoPots(cookieStore, potsByHousehold);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("adjust_savings_pot", {
      target_pot_id: parsed.data.potId,
      adjustment_amount: signedAmount,
      entry_note: parsed.data.note,
    });

    if (error) {
      return {
        error: error.message.includes("Onvoldoende")
          ? "Er staat niet genoeg geld in dit spaarpotje."
          : "Het saldo kon niet worden aangepast.",
      };
    }
  }

  revalidatePath("/finances/pots");
  return {
    success:
      parsed.data.direction === "deposit"
        ? "Geld toegevoegd."
        : "Geld opgenomen.",
  };
}

export async function deleteSavingsPotAction(potId: string) {
  if (!potId) return { error: "Spaarpotje ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, potsByHousehold } = await getDemoPots();
    const pots = getDemoPotList(potsByHousehold, viewer.household.id);
    potsByHousehold[viewer.household.id] = pots.filter(
      (pot) => pot.id !== potId,
    );
    saveDemoPots(cookieStore, potsByHousehold);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("savings_pots")
      .delete()
      .eq("id", potId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "Het spaarpotje kon niet worden verwijderd." };
    }
  }

  revalidatePath("/finances/pots");
  return { success: true };
}
