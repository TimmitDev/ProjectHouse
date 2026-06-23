import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroceryBoard } from "@/components/groceries/grocery-board";
import { PageHeader } from "@/components/ui/card";
import { getGroceryItems, getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Boodschappen" };

export default async function GroceriesPage() {
  const viewer = await getViewer();
  if (!viewer?.household) redirect("/onboarding");
  if (!viewer.enabledModules.includes("groceries")) redirect("/modules");

  const items = await getGroceryItems(viewer);
  const listVersion = items
    .map((item) => `${item.id}:${item.completed}`)
    .join("|");

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Samen regelen"
        title="Boodschappen"
        description={`Eén actuele lijst voor iedereen in ${viewer.household.name}.`}
      />
      <GroceryBoard key={listVersion} initialItems={items} />
    </div>
  );
}
