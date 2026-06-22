"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/app";

const createSchema = z.object({
  householdName: z.string().trim().min(2, "Vul een huishoudnaam in.").max(60),
  currency: z.string().length(3),
});

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4, "Vul een geldige uitnodigingscode in.").max(20),
});

async function completeDemoHousehold() {
  const cookieStore = await cookies();
  cookieStore.set("nestly_demo_household", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function createHouseholdAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createSchema.safeParse({
    householdName: formData.get("householdName"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer het formulier.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (isDemoMode) {
    await completeDemoHousehold();
    redirect("/dashboard");
  }

  if (!isSupabaseConfigured) {
    return { error: "Supabase is niet geconfigureerd." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", {
    household_name: parsed.data.householdName,
    household_currency: parsed.data.currency,
  });

  if (error) {
    return {
      error:
        error.message.includes("already belong") ||
        error.message.includes("al lid")
        ? "Je bent al lid van een huishouden."
        : "Het huishouden kon niet worden aangemaakt.",
    };
  }

  redirect("/dashboard");
}

export async function joinHouseholdAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return {
      error: "Vul de ontvangen uitnodigingscode in.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (isDemoMode) {
    await completeDemoHousehold();
    redirect("/dashboard");
  }

  if (!isSupabaseConfigured) {
    return { error: "Supabase is niet geconfigureerd." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", {
    household_code: parsed.data.inviteCode,
  });

  if (error) {
    return {
      error:
        error.message.includes("No household") ||
        error.message.includes("Geen huishouden")
        ? "We konden geen huishouden met deze uitnodigingscode vinden."
        : error.message.includes("already belong") ||
            error.message.includes("al lid")
          ? "Je bent al lid van een huishouden."
          : "Deelname aan het huishouden is mislukt.",
    };
  }

  redirect("/dashboard");
}
