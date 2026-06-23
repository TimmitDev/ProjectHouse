"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { demoGroceryItems } from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  GroceryCategory,
  GroceryItem,
} from "@/types/app";

const groceryCategories = [
  "produce",
  "bakery",
  "dairy",
  "meat",
  "pantry",
  "frozen",
  "drinks",
  "household",
  "other",
] as const satisfies readonly GroceryCategory[];

const groceryItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vul een product in.")
    .max(100, "Gebruik maximaal 100 tekens."),
  quantity: z
    .string()
    .trim()
    .min(1, "Vul een hoeveelheid in.")
    .max(30, "Gebruik maximaal 30 tekens."),
  category: z.enum(groceryCategories),
});

type DemoGroceryLists = Record<string, GroceryItem[]>;

async function getDemoLists() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("nestly_demo_groceries")?.value;

  if (!raw) return { cookieStore, lists: {} as DemoGroceryLists };

  try {
    return {
      cookieStore,
      lists: JSON.parse(raw) as DemoGroceryLists,
    };
  } catch {
    return { cookieStore, lists: {} as DemoGroceryLists };
  }
}

function getDemoList(lists: DemoGroceryLists, householdId: string) {
  return lists[householdId]
    ? [...lists[householdId]]
    : demoGroceryItems.map((item) => ({ ...item }));
}

function saveDemoLists(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  lists: DemoGroceryLists,
) {
  cookieStore.set("nestly_demo_groceries", JSON.stringify(lists), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function addGroceryItemAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = groceryItemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || "1",
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer het nieuwe boodschappenitem.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const items = getDemoList(lists, viewer.household.id);
    items.unshift({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      category: parsed.data.category,
      completed: false,
      addedBy: viewer.profile.id,
      completedBy: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
    });
    lists[viewer.household.id] = items;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("grocery_items").insert({
      household_id: viewer.household.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      category: parsed.data.category,
      added_by: viewer.profile.id,
    });

    if (error) {
      return { error: "Het product kon niet worden toegevoegd." };
    }
  }

  revalidatePath("/groceries");
  return { success: "Toegevoegd aan de lijst." };
}

export async function toggleGroceryItemAction(
  itemId: string,
  completed: boolean,
) {
  if (!itemId) return { error: "Boodschappenitem ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const items = getDemoList(lists, viewer.household.id);
    const item = items.find((entry) => entry.id === itemId);

    if (!item) return { error: "Product niet gevonden." };

    item.completed = completed;
    item.completedBy = completed ? viewer.profile.id : null;
    item.completedAt = completed ? new Date().toISOString() : null;
    lists[viewer.household.id] = items;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("grocery_items")
      .update({
        completed,
        completed_by: completed ? viewer.profile.id : null,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De status kon niet worden bijgewerkt." };
    }
  }

  revalidatePath("/groceries");
  return { success: true };
}

export async function deleteGroceryItemAction(itemId: string) {
  if (!itemId) return { error: "Boodschappenitem ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const items = getDemoList(lists, viewer.household.id);
    lists[viewer.household.id] = items.filter((item) => item.id !== itemId);
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("id", itemId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "Het product kon niet worden verwijderd." };
    }
  }

  revalidatePath("/groceries");
  return { success: true };
}

export async function clearCompletedGroceriesAction() {
  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const items = getDemoList(lists, viewer.household.id);
    lists[viewer.household.id] = items.filter((item) => !item.completed);
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("household_id", viewer.household.id)
      .eq("completed", true);

    if (error) {
      return { error: "Afgeronde producten konden niet worden opgeruimd." };
    }
  }

  revalidatePath("/groceries");
  return { success: true };
}
