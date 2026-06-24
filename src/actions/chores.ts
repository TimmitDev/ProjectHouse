"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { demoDashboardData, demoHouseholdChores } from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  ChoreArea,
  ChoreFrequency,
  HouseholdChore,
} from "@/types/app";

const choreAreas = [
  "kitchen",
  "bathroom",
  "living",
  "bedroom",
  "outside",
  "admin",
  "other",
] as const satisfies readonly ChoreArea[];

const choreFrequencies = [
  "once",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
] as const satisfies readonly ChoreFrequency[];

const choreSchema = z.object({
  title: z.string().trim().min(1, "Vul een taak in.").max(120),
  description: z.string().trim().max(500).default(""),
  area: z.enum(choreAreas),
  frequency: z.enum(choreFrequencies),
  dueDate: z.iso.date(),
  assignedTo: z.string().optional(),
});

type DemoChoreLists = Record<string, HouseholdChore[]>;

async function getDemoLists() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("nestly_demo_chores")?.value;

  if (!raw) return { cookieStore, lists: {} as DemoChoreLists };

  try {
    return {
      cookieStore,
      lists: JSON.parse(raw) as DemoChoreLists,
    };
  } catch {
    return { cookieStore, lists: {} as DemoChoreLists };
  }
}

function getDemoList(lists: DemoChoreLists, householdId: string) {
  return lists[householdId]
    ? [...lists[householdId]]
    : demoHouseholdChores.map((chore) => ({ ...chore }));
}

function saveDemoLists(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  lists: DemoChoreLists,
) {
  cookieStore.set("nestly_demo_chores", JSON.stringify(lists), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function advanceDueDate(value: string, frequency: ChoreFrequency) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (frequency === "daily") {
    date.setUTCDate(date.getUTCDate() + 1);
    return toDateOnly(date);
  }

  if (frequency === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7);
    return toDateOnly(date);
  }

  if (frequency === "biweekly") {
    date.setUTCDate(date.getUTCDate() + 14);
    return toDateOnly(date);
  }

  if (frequency === "monthly") {
    const targetMonth = date.getUTCMonth() + 1;
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    return toDateOnly(
      new Date(
        Date.UTC(
          targetYear,
          normalizedMonth,
          Math.min(day, daysInMonth(targetYear, normalizedMonth)),
        ),
      ),
    );
  }

  return value;
}

export async function createChoreAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = choreSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    area: formData.get("area"),
    frequency: formData.get("frequency"),
    dueDate: formData.get("dueDate"),
    assignedTo: formData.get("assignedTo") || "",
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gegevens van de taak.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  const assignedTo = parsed.data.assignedTo || null;

  if (isDemoMode) {
    const assignedMember = assignedTo
      ? demoDashboardData.members.find((member) => member.id === assignedTo)
      : null;

    if (assignedTo && !assignedMember) {
      return { error: "Het gekozen huishoudlid bestaat niet." };
    }

    const { cookieStore, lists } = await getDemoLists();
    const chores = getDemoList(lists, viewer.household.id);
    chores.unshift({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      description: parsed.data.description,
      area: parsed.data.area,
      frequency: parsed.data.frequency,
      dueDate: parsed.data.dueDate,
      assignedTo,
      assignedToName: assignedMember?.name ?? "Iedereen",
      completedAt: null,
      completedBy: null,
      lastCompletedAt: null,
      lastCompletedBy: null,
      createdBy: viewer.profile.id,
      createdAt: new Date().toISOString(),
    });
    lists[viewer.household.id] = chores;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();

    if (assignedTo) {
      const { data: assignedMember } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", viewer.household.id)
        .eq("user_id", assignedTo)
        .maybeSingle();

      if (!assignedMember) {
        return { error: "Het gekozen huishoudlid bestaat niet." };
      }
    }

    const { error } = await supabase.from("household_chores").insert({
      household_id: viewer.household.id,
      title: parsed.data.title,
      description: parsed.data.description,
      area: parsed.data.area,
      frequency: parsed.data.frequency,
      due_date: parsed.data.dueDate,
      assigned_to: assignedTo,
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: "De taak kon niet worden opgeslagen." };
    }
  }

  revalidatePath("/chores");
  return { success: "Taak toegevoegd." };
}

export async function completeChoreAction(choreId: string) {
  if (!choreId) return { error: "Taak ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  const completedAt = new Date().toISOString();

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const chores = getDemoList(lists, viewer.household.id);
    const chore = chores.find((item) => item.id === choreId);

    if (!chore) return { error: "Taak niet gevonden." };

    chore.lastCompletedAt = completedAt;
    chore.lastCompletedBy = viewer.profile.id;

    if (chore.frequency === "once") {
      chore.completedAt = completedAt;
      chore.completedBy = viewer.profile.id;
    } else {
      chore.dueDate = advanceDueDate(chore.dueDate, chore.frequency);
      chore.completedAt = null;
      chore.completedBy = null;
    }

    lists[viewer.household.id] = chores;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { data: chore, error: fetchError } = await supabase
      .from("household_chores")
      .select("frequency, due_date")
      .eq("id", choreId)
      .eq("household_id", viewer.household.id)
      .maybeSingle();

    if (fetchError || !chore) {
      return { error: "Taak niet gevonden." };
    }

    const repeating = chore.frequency !== "once";
    const { error } = await supabase
      .from("household_chores")
      .update({
        due_date: repeating
          ? advanceDueDate(chore.due_date, chore.frequency)
          : chore.due_date,
        completed_at: repeating ? null : completedAt,
        completed_by: repeating ? null : viewer.profile.id,
        last_completed_at: completedAt,
        last_completed_by: viewer.profile.id,
        updated_at: completedAt,
      })
      .eq("id", choreId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De taak kon niet worden bijgewerkt." };
    }
  }

  revalidatePath("/chores");
  return { success: true };
}

export async function reopenChoreAction(choreId: string) {
  if (!choreId) return { error: "Taak ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const chores = getDemoList(lists, viewer.household.id);
    const chore = chores.find((item) => item.id === choreId);

    if (!chore) return { error: "Taak niet gevonden." };

    chore.completedAt = null;
    chore.completedBy = null;
    lists[viewer.household.id] = chores;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("household_chores")
      .update({
        completed_at: null,
        completed_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", choreId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De taak kon niet worden teruggezet." };
    }
  }

  revalidatePath("/chores");
  return { success: true };
}

export async function deleteChoreAction(choreId: string) {
  if (!choreId) return { error: "Taak ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const chores = getDemoList(lists, viewer.household.id);
    lists[viewer.household.id] = chores.filter((chore) => chore.id !== choreId);
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("household_chores")
      .delete()
      .eq("id", choreId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De taak kon niet worden verwijderd." };
    }
  }

  revalidatePath("/chores");
  return { success: true };
}
