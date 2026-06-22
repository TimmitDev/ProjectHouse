"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/data";

export async function switchHouseholdAction(formData: FormData) {
  const householdId = String(formData.get("householdId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");
  const viewer = await getViewer();

  if (!viewer?.households.some((household) => household.id === householdId)) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  cookieStore.set("nestly_active_household", householdId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  const safeReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/dashboard";
  redirect(safeReturnTo);
}
