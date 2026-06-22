import { cookies } from "next/headers";

import {
  demoDashboardData,
  demoFinancialAgendaItems,
  demoHouseholds,
  demoViewer,
} from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  DashboardData,
  FinancialAgendaData,
  FinancialAgendaItem,
  Household,
  ModuleKey,
  SavingsGoal,
  Viewer,
} from "@/types/app";

function numeric(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

async function getDemoViewer(): Promise<Viewer | null> {
  const cookieStore = await cookies();

  if (!cookieStore.has("nestly_demo_session")) {
    return null;
  }

  const hasHousehold = cookieStore.has("nestly_demo_household");
  const enabledModules = cookieStore.get("nestly_demo_modules")?.value
    ?.split(",")
    .filter(Boolean) as ModuleKey[] | undefined;
  const customHouseholds = JSON.parse(
    cookieStore.get("nestly_demo_households")?.value || "[]",
  ) as Household[];
  const households = hasHousehold
    ? [...demoHouseholds, ...customHouseholds]
    : [];
  const activeHouseholdId = cookieStore.get(
    "nestly_active_household",
  )?.value;
  const activeHousehold =
    households.find((item) => item.id === activeHouseholdId) ??
    households[0] ??
    null;

  return {
    ...demoViewer,
    profile: {
      ...demoViewer.profile,
      fullName:
        cookieStore.get("nestly_demo_name")?.value ||
        demoViewer.profile.fullName,
      accentColor:
        cookieStore.get("nestly_demo_accent")?.value ||
        demoViewer.profile.accentColor,
      locale:
        cookieStore.get("nestly_demo_locale")?.value ||
        demoViewer.profile.locale,
      currency:
        cookieStore.get("nestly_demo_currency")?.value ||
        demoViewer.profile.currency,
    },
    household: activeHousehold,
    households,
    enabledModules: enabledModules?.length ? enabledModules : ["finances"],
  };
}

export async function getViewer(): Promise<Viewer | null> {
  if (isDemoMode) {
    return getDemoViewer();
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id),
  ]);

  let household: Viewer["household"] = null;
  let households: Viewer["households"] = [];
  let enabledModules: ModuleKey[] = [];

  if (memberships?.length) {
    const householdIds = memberships.map((item) => item.household_id);
    const { data: householdRows } = await supabase
      .from("households")
      .select("id, name, invite_code, currency")
      .in("id", householdIds);

    households =
      memberships.flatMap((membership) => {
        const row = householdRows?.find(
          (item) => item.id === membership.household_id,
        );
        return row
          ? [
              {
                id: row.id,
                name: row.name,
                inviteCode: row.invite_code,
                currency: row.currency,
                role: membership.role,
              },
            ]
          : [];
      }) ?? [];

    const cookieStore = await cookies();
    const activeHouseholdId = cookieStore.get(
      "nestly_active_household",
    )?.value;
    household =
      households.find((item) => item.id === activeHouseholdId) ??
      households[0] ??
      null;

    if (household) {
      const { data: moduleRows } = await supabase
        .from("household_modules")
        .select("module_key, enabled")
        .eq("household_id", household.id)
        .eq("enabled", true);

      enabledModules =
        moduleRows?.map((row) => row.module_key as ModuleKey) ?? [];
    }
  }

  return {
    profile: {
      id: user.id,
      fullName:
        profile?.full_name ||
        String(user.user_metadata.full_name ?? user.email?.split("@")[0] ?? ""),
      email: user.email ?? "",
      locale: profile?.locale ?? "nl-NL",
      currency: profile?.currency ?? "EUR",
      accentColor: profile?.accent_color ?? "#52796F",
    },
    household,
    households,
    enabledModules,
    isDemo: false,
  };
}

async function getDemoDashboardData(): Promise<DashboardData> {
  const cookieStore = await cookies();
  const contributions = JSON.parse(
    cookieStore.get("nestly_demo_contributions")?.value || "{}",
  ) as Record<string, number>;
  const customGoals = JSON.parse(
    cookieStore.get("nestly_demo_goals")?.value || "[]",
  ) as SavingsGoal[];

  return {
    ...demoDashboardData,
    goals: [...demoDashboardData.goals, ...customGoals].map((goal) => ({
      ...goal,
      currentAmount:
        goal.currentAmount + numeric(contributions[goal.id] ?? 0),
    })),
  };
}

export async function getDashboardData(
  viewer: Viewer,
): Promise<DashboardData> {
  if (viewer.isDemo) {
    return getDemoDashboardData();
  }

  if (!viewer.household) {
    return {
      balance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      savingsRate: 0,
      goals: [],
      transactions: [],
      members: [],
    };
  }

  const supabase = await createClient();
  const householdId = viewer.household.id;
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .slice(0, 10);

  const [
    { data: goals },
    { data: recentTransactions },
    { data: allTransactions },
    { data: memberships },
  ] = await Promise.all([
    supabase
      .from("savings_goals")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("*")
      .eq("household_id", householdId)
      .order("transaction_date", { ascending: false })
      .limit(8),
    supabase
      .from("transactions")
      .select("amount, type, transaction_date")
      .eq("household_id", householdId),
    supabase
      .from("household_members")
      .select("user_id, role")
      .eq("household_id", householdId),
  ]);

  const memberIds = memberships?.map((member) => member.user_id) ?? [];
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
    : { data: [] };

  const monthly = allTransactions?.filter(
    (transaction) => transaction.transaction_date >= monthStart,
  );
  const monthlyIncome =
    monthly
      ?.filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + numeric(transaction.amount), 0) ??
    0;
  const monthlyExpenses =
    monthly
      ?.filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + numeric(transaction.amount), 0) ??
    0;
  const totalIncome =
    allTransactions
      ?.filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + numeric(transaction.amount), 0) ??
    0;
  const totalExpenses =
    allTransactions
      ?.filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + numeric(transaction.amount), 0) ??
    0;

  return {
    balance: totalIncome - totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings: Math.max(0, monthlyIncome - monthlyExpenses),
    savingsRate:
      monthlyIncome > 0
        ? Math.round(
            ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100,
          )
        : 0,
    goals:
      goals?.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: numeric(goal.target_amount),
        currentAmount: numeric(goal.current_amount),
        deadline: goal.deadline,
        color: goal.color,
        icon: goal.icon,
      })) ?? [],
    transactions:
      recentTransactions?.map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        category: transaction.category,
        amount: numeric(transaction.amount),
        transactionDate: transaction.transaction_date,
        type: transaction.type,
      })) ?? [],
    members:
      memberships?.map((member) => {
        const profile = profiles?.find(
          (profileRow) => profileRow.id === member.user_id,
        );
        return {
          id: member.user_id,
          name: profile?.full_name || "Huishoudlid",
          email: member.user_id === viewer.profile.id ? viewer.profile.email : "",
          role: member.role,
        };
      }) ?? [],
  };
}

export async function getFinancialAgendaData(
  viewer: Viewer,
): Promise<FinancialAgendaData> {
  if (viewer.isDemo) {
    const cookieStore = await cookies();
    const customItems = JSON.parse(
      cookieStore.get("nestly_demo_financial_agenda")?.value || "[]",
    ) as FinancialAgendaItem[];

    return {
      items: [...demoFinancialAgendaItems, ...customItems],
      members: demoDashboardData.members,
    };
  }

  if (!viewer.household) {
    return { items: [], members: [] };
  }

  const supabase = await createClient();
  const householdId = viewer.household.id;
  const [{ data: agendaItems }, { data: memberships }] = await Promise.all([
    supabase
      .from("financial_agenda_items")
      .select("*")
      .eq("household_id", householdId)
      .order("due_date", { ascending: true }),
    supabase
      .from("household_members")
      .select("user_id, role")
      .eq("household_id", householdId),
  ]);

  const memberIds = memberships?.map((member) => member.user_id) ?? [];
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
    : { data: [] };

  const members =
    memberships?.map((member) => {
      const profile = profiles?.find((row) => row.id === member.user_id);
      return {
        id: member.user_id,
        name: profile?.full_name || "Huishoudlid",
        email: member.user_id === viewer.profile.id ? viewer.profile.email : "",
        role: member.role,
      };
    }) ?? [];

  return {
    items:
      agendaItems?.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        amount: numeric(item.amount),
        type: item.type,
        dueDate: item.due_date,
        recurrence: item.recurrence,
        assignedTo: item.assigned_to,
        assignedToName:
          members.find((member) => member.id === item.assigned_to)?.name ||
          "Huishoudlid",
        createdBy: item.created_by,
      })) ?? [],
    members,
  };
}
