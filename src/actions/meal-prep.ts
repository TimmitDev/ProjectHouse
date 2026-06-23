"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { demoMealPrepRecipes } from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  MealPrepRecipe,
  MealStorageMethod,
} from "@/types/app";

const storageMethods = [
  "fridge",
  "freezer",
  "room_temperature",
] as const satisfies readonly MealStorageMethod[];

const recipeSchema = z.object({
  name: z.string().trim().min(2, "Geef het gerecht een naam.").max(100),
  description: z.string().trim().max(240).default(""),
  ingredients: z
    .string()
    .trim()
    .min(1, "Voeg minimaal één ingrediënt toe.")
    .max(2000),
  instructions: z.string().trim().max(2000).default(""),
  servings: z.coerce.number().int().min(1).max(30),
  prepMinutes: z.coerce.number().int().min(1).max(1440),
  storageMethod: z.enum(storageMethods),
  shelfLifeDays: z.coerce.number().int().min(1).max(365),
});

type DemoMealPrepLists = Record<string, MealPrepRecipe[]>;

async function getDemoLists() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("nestly_demo_meal_prep")?.value;

  if (!raw) return { cookieStore, lists: {} as DemoMealPrepLists };

  try {
    return {
      cookieStore,
      lists: JSON.parse(raw) as DemoMealPrepLists,
    };
  } catch {
    return { cookieStore, lists: {} as DemoMealPrepLists };
  }
}

function getDemoList(lists: DemoMealPrepLists, householdId: string) {
  return lists[householdId]
    ? [...lists[householdId]]
    : demoMealPrepRecipes.map((recipe) => ({
        ...recipe,
        ingredients: [...recipe.ingredients],
      }));
}

function saveDemoLists(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  lists: DemoMealPrepLists,
) {
  cookieStore.set("nestly_demo_meal_prep", JSON.stringify(lists), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

function parseIngredients(value: string) {
  return value
    .split(/\r?\n/)
    .map((ingredient) => ingredient.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean)
    .slice(0, 40);
}

export async function createMealPrepRecipeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = recipeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    ingredients: formData.get("ingredients"),
    instructions: formData.get("instructions") || "",
    servings: formData.get("servings"),
    prepMinutes: formData.get("prepMinutes"),
    storageMethod: formData.get("storageMethod"),
    shelfLifeDays: formData.get("shelfLifeDays"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gegevens van het gerecht.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const ingredients = parseIngredients(parsed.data.ingredients);
  if (!ingredients.length) {
    return {
      error: "Voeg minimaal één ingrediënt toe.",
      fieldErrors: { ingredients: ["Zet ieder ingrediënt op een eigen regel."] },
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const recipes = getDemoList(lists, viewer.household.id);
    recipes.unshift({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      description: parsed.data.description,
      ingredients,
      instructions: parsed.data.instructions,
      servings: parsed.data.servings,
      prepMinutes: parsed.data.prepMinutes,
      storageMethod: parsed.data.storageMethod,
      shelfLifeDays: parsed.data.shelfLifeDays,
      lastPreparedAt: null,
      createdBy: viewer.profile.id,
      createdAt: new Date().toISOString(),
    });
    lists[viewer.household.id] = recipes;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("meal_prep_recipes").insert({
      household_id: viewer.household.id,
      name: parsed.data.name,
      description: parsed.data.description,
      ingredients,
      instructions: parsed.data.instructions,
      servings: parsed.data.servings,
      prep_minutes: parsed.data.prepMinutes,
      storage_method: parsed.data.storageMethod,
      shelf_life_days: parsed.data.shelfLifeDays,
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: "Het gerecht kon niet worden opgeslagen." };
    }
  }

  revalidatePath("/groceries/meal-prep");
  return { success: "Gerecht opgeslagen." };
}

export async function markMealPreparedAction(recipeId: string) {
  if (!recipeId) return { error: "Gerecht ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  const preparedAt = new Date().toISOString();

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const recipes = getDemoList(lists, viewer.household.id);
    const recipe = recipes.find((item) => item.id === recipeId);

    if (!recipe) return { error: "Gerecht niet gevonden." };

    recipe.lastPreparedAt = preparedAt;
    lists[viewer.household.id] = recipes;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("meal_prep_recipes")
      .update({
        last_prepared_at: preparedAt,
        updated_at: preparedAt,
      })
      .eq("id", recipeId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De bereidingsdatum kon niet worden bijgewerkt." };
    }
  }

  revalidatePath("/groceries/meal-prep");
  return { success: true, preparedAt };
}

export async function deleteMealPrepRecipeAction(recipeId: string) {
  if (!recipeId) return { error: "Gerecht ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const recipes = getDemoList(lists, viewer.household.id);
    lists[viewer.household.id] = recipes.filter(
      (recipe) => recipe.id !== recipeId,
    );
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("meal_prep_recipes")
      .delete()
      .eq("id", recipeId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "Het gerecht kon niet worden verwijderd." };
    }
  }

  revalidatePath("/groceries/meal-prep");
  return { success: true };
}
