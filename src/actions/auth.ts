"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSiteUrl, isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/app";

const loginSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in."),
  password: z.string().min(8, "Het wachtwoord moet minimaal 8 tekens bevatten."),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Vul je volledige naam in.").max(80),
});

async function setDemoCookies(includeHousehold: boolean, name?: string) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };

  cookieStore.set("nestly_demo_session", "1", options);
  if (includeHousehold) {
    cookieStore.set("nestly_demo_household", "1", options);
  } else {
    cookieStore.delete("nestly_demo_household");
  }
  if (name) {
    cookieStore.set("nestly_demo_name", name, options);
  }
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gemarkeerde velden.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (isDemoMode) {
    await setDemoCookies(true);
    redirect("/dashboard");
  }

  if (!isSupabaseConfigured) {
    return { error: "Supabase is niet geconfigureerd voor deze omgeving." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Het e-mailadres of wachtwoord is onjuist." };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gemarkeerde velden.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (isDemoMode) {
    await setDemoCookies(false, parsed.data.fullName);
    redirect("/onboarding");
  }

  if (!isSupabaseConfigured) {
    return { error: "Supabase is niet geconfigureerd voor deze omgeving." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    return {
      error:
        error.message === "User already registered"
          ? "Er bestaat al een account met dit e-mailadres."
          : "Het account kon niet worden aangemaakt. Probeer het opnieuw.",
    };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect(`/check-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function startDemoAction() {
  if (!isDemoMode) {
    redirect("/login");
  }
  await setDemoCookies(true);
  redirect("/dashboard");
}

export async function logoutAction() {
  if (isDemoMode) {
    const cookieStore = await cookies();
    [
      "nestly_demo_session",
      "nestly_demo_household",
      "nestly_demo_name",
      "nestly_demo_accent",
      "nestly_demo_locale",
      "nestly_demo_currency",
      "nestly_demo_modules",
      "nestly_demo_goals",
      "nestly_demo_contributions",
    ].forEach((name) => cookieStore.delete(name));
  } else if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
