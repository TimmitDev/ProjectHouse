"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getViewer } from "@/lib/data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ModuleKey } from "@/types/app";

const validModules: ModuleKey[] = [
  "finances",
  "calendar",
  "chores",
  "groceries",
];

export async function toggleModuleAction(
  moduleKey: ModuleKey,
  enabled: boolean,
) {
  if (!validModules.includes(moduleKey)) {
    return { error: "Onbekende module." };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (viewer.household.role === "member") {
    return { error: "Alleen beheerders kunnen modules beheren." };
  }

  if (isDemoMode) {
    const enabledModules = new Set(viewer.enabledModules);
    if (enabled) enabledModules.add(moduleKey);
    else enabledModules.delete(moduleKey);
    const cookieStore = await cookies();
    cookieStore.set(
      "nestly_demo_modules",
      Array.from(enabledModules).join(","),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    );
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("household_modules").upsert(
      {
        household_id: viewer.household.id,
        module_key: moduleKey,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id,module_key" },
    );

    if (error) {
      return { error: "De module kon niet worden bijgewerkt." };
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
