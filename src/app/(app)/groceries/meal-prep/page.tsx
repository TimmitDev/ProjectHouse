import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MealPrepBoard } from "@/components/groceries/meal-prep-board";
import { PageHeader } from "@/components/ui/card";
import { getMealPrepRecipes, getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Mealprep" };

export default async function MealPrepPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("groceries")) redirect("/modules");

  const recipes = await getMealPrepRecipes(viewer);
  const recipeVersion = recipes
    .map((recipe) => `${recipe.id}:${recipe.lastPreparedAt ?? ""}`)
    .join("|");

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Boodschappen"
        title="Mealprep"
        description="Bewaar favoriete gerechten, maak ze zonder zoekwerk opnieuw en houd bij hoelang ze goed blijven."
      />
      <MealPrepBoard
        key={recipeVersion}
        initialRecipes={recipes}
        locale={viewer.profile.locale}
      />
    </div>
  );
}
