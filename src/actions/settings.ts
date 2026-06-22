"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getSiteUrl,
  isDemoMode,
  isSupabaseConfigured,
} from "@/lib/env";
import { getViewer } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/app";

const settingsSchema = z.object({
  fullName: z.string().trim().min(2, "Vul je volledige naam in.").max(80),
  email: z.email("Vul een geldig e-mailadres in."),
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

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Gebruik minimaal 8 tekens.")
      .max(72, "Gebruik maximaal 72 tekens."),
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "De wachtwoorden komen niet overeen.",
    path: ["passwordConfirmation"],
  });

const deleteAccountSchema = z.object({
  confirmation: z.literal("VERWIJDER"),
});

export async function updateSettingsAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = settingsSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    locale: formData.get("locale"),
    currency: formData.get("currency"),
    accentColor: formData.get("accentColor"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer je instellingen.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer) {
    return { error: "Je sessie is verlopen. Log opnieuw in." };
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
    cookieStore.set("nestly_demo_email", parsed.data.email, options);
    cookieStore.set("nestly_demo_locale", parsed.data.locale, options);
    cookieStore.set("nestly_demo_currency", parsed.data.currency, options);
    cookieStore.set("nestly_demo_accent", parsed.data.accentColor, options);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }
    const supabase = await createClient();
    if (parsed.data.email !== viewer.profile.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: parsed.data.email,
      });

      if (emailError) {
        return { error: "Je nieuwe e-mailadres kon niet worden ingesteld." };
      }
    }

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
      return { error: "Je instellingen konden niet worden opgeslagen." };
    }
  }

  revalidatePath("/", "layout");
  return {
    success:
      parsed.data.email !== viewer.profile.email
        ? "Instellingen opgeslagen. Bevestig je nieuwe e-mailadres via de ontvangen e-mail."
        : "Je instellingen zijn opgeslagen.",
  };
}

export async function changePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer je nieuwe wachtwoord.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer) {
    return { error: "Je sessie is verlopen. Log opnieuw in." };
  }

  if (!isDemoMode) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return {
        error:
          "Je wachtwoord kon niet worden gewijzigd. Vraag eventueel een resetmail aan.",
      };
    }
  }

  return { success: "Je wachtwoord is gewijzigd." };
}

export async function requestPasswordResetAction(
  _previousState: ActionState,
): Promise<ActionState> {
  void _previousState;
  const viewer = await getViewer();
  if (!viewer) {
    return { error: "Je sessie is verlopen. Log opnieuw in." };
  }

  if (!isDemoMode) {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      viewer.profile.email,
      {
        redirectTo: `${getSiteUrl()}/auth/confirm?next=/reset-password`,
      },
    );

    if (error) {
      return { error: "De resetmail kon niet worden verstuurd." };
    }
  }

  return {
    success: `Resetmail verstuurd naar ${viewer.profile.email}.`,
  };
}

export async function deleteAccountAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return { error: "Typ VERWIJDER om je keuze te bevestigen." };
  }

  const viewer = await getViewer();
  if (!viewer) {
    return { error: "Je sessie is verlopen. Log opnieuw in." };
  }

  if (isDemoMode) {
    const cookieStore = await cookies();
    cookieStore.getAll().forEach(({ name }) => {
      if (name.startsWith("nestly_")) cookieStore.delete(name);
    });
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_own_account");

    if (error) {
      return {
        error:
          "Je account kon niet worden verwijderd. Probeer het later opnieuw.",
      };
    }

    await supabase.auth.signOut();
  }

  redirect("/login?account=deleted");
}
