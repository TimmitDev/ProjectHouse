"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { getViewer } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/app";

const settingsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
  locale: z.enum(["en-US", "en-GB", "nl-NL", "de-DE", "fr-FR", "es-ES"]),
  currency: z.enum(["EUR", "USD", "GBP", "CAD", "AUD", "JPY"]),
  accentColor: z.enum([
    "#52796F",
    "#4776A8",
    "#7A62A8",
    "#B66550",
    "#A3782B",
    "#3F7F89",
  ]),
});

export async function updateSettingsAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = settingsSchema.safeParse({
    fullName: formData.get("fullName"),
    locale: formData.get("locale"),
    currency: formData.get("currency"),
    accentColor: formData.get("accentColor"),
  });

  if (!parsed.success) {
    return {
      error: "Please check your settings.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer) {
    return { error: "Your session has expired. Please sign in again." };
  }

  if (isDemoMode) {
    const cookieStore = await cookies();
    const options = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };
    cookieStore.set("nestly_demo_name", parsed.data.fullName, options);
    cookieStore.set("nestly_demo_locale", parsed.data.locale, options);
    cookieStore.set("nestly_demo_currency", parsed.data.currency, options);
    cookieStore.set("nestly_demo_accent", parsed.data.accentColor, options);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        locale: parsed.data.locale,
        currency: parsed.data.currency,
        accent_color: parsed.data.accentColor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", viewer.profile.id);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/", "layout");
  return { success: "Your settings have been saved." };
}
