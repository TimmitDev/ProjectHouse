"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, SavingsGoal } from "@/types/app";

const goalSchema = z.object({
  name: z.string().trim().min(2, "Give your goal a name.").max(80),
  targetAmount: z.coerce.number().positive("Target must be greater than zero."),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#52796F"),
});

const contributionSchema = z.object({
  goalId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than zero."),
});

export async function createGoalAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || 0,
    deadline: formData.get("deadline") || undefined,
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return {
      error: "Please check the goal details.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "No household found." };
  }

  if (isDemoMode) {
    const cookieStore = await cookies();
    const goals = JSON.parse(
      cookieStore.get("nestly_demo_goals")?.value || "[]",
    ) as SavingsGoal[];
    goals.push({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount,
      deadline: parsed.data.deadline || null,
      color: parsed.data.color,
      icon: "target",
    });
    cookieStore.set("nestly_demo_goals", JSON.stringify(goals), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("savings_goals").insert({
      household_id: viewer.household.id,
      name: parsed.data.name,
      target_amount: parsed.data.targetAmount,
      current_amount: parsed.data.currentAmount,
      deadline: parsed.data.deadline || null,
      color: parsed.data.color,
      icon: "target",
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/finances/goals");
  revalidatePath("/dashboard");
  return { success: "Savings goal created." };
}

export async function contributeToGoalAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contributionSchema.safeParse({
    goalId: formData.get("goalId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return {
      error: "Enter a valid amount.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "No household found." };
  }

  if (isDemoMode) {
    const cookieStore = await cookies();
    const contributions = JSON.parse(
      cookieStore.get("nestly_demo_contributions")?.value || "{}",
    ) as Record<string, number>;
    contributions[parsed.data.goalId] =
      (contributions[parsed.data.goalId] ?? 0) + parsed.data.amount;
    cookieStore.set(
      "nestly_demo_contributions",
      JSON.stringify(contributions),
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
      return { error: "Supabase is not configured." };
    }
    const supabase = await createClient();
    const { error } = await supabase.rpc("contribute_to_savings_goal", {
      goal_id: parsed.data.goalId,
      contribution_amount: parsed.data.amount,
    });

    if (error) {
      return {
        error: error.message.includes("not found")
          ? "Savings goal not found."
          : error.message,
      };
    }
  }

  revalidatePath("/finances/goals");
  revalidatePath("/dashboard");
  return { success: "Contribution added." };
}
