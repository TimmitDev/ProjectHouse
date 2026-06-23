import { cookies } from "next/headers";
import { cache } from "react";

import {
  demoDashboardData,
  demoFinancialAgendaItems,
  demoGroceryItems,
  demoMealPrepRecipes,
  demoHouseholds,
  demoViewer,
} from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  DashboardData,
  FinancialAgendaData,
  FinancialAgendaItem,
  GroceryItem,
  Household,
  HouseholdMember,
  ModuleKey,
  MealPrepRecipe,
  SavingsGoal,
  Transaction,
  Viewer,
} from "@/types/app";

type ViewerContextRpc = {
  profile?: {
    full_name?: string;
    locale?: string;
    currency?: string;
    accent_color?: string;
  };
  households?: Array<{
    id: string;
    name: string;
    invite_code: string;
    currency: string;
    role: Household["role"];
  }>;
  active_household_id?: string | null;
  enabled_modules?: ModuleKey[];
};

type DashboardRpc = {
  total_income?: number | string;
  total_expenses?: number | string;
  monthly_income?: number | string;
  monthly_expenses?: number | string;
  goals?: Array<{
    id: string;
    name: string;
    target_amount: number | string;
    current_amount: number | string;
    deadline: string | null;
    color: string;
    icon: string;
  }>;
  transactions?: Array<{
    id: string;
    description: string;
    category: string;
    amount: number | string;
    transaction_date: string;
    type: Transaction["type"];
  }>;
  members?: Array<{
    id: string;
    name: string;
    role: HouseholdMember["role"];
  }>;
};

type FinancialAgendaRpc = {
  items?: Array<{
    id: string;
    title: string;
    category: string;
    amount: number | string;
    type: FinancialAgendaItem["type"];
    due_date: string;
    recurrence: FinancialAgendaItem["recurrence"];
    assigned_to: string;
    assigned_to_name: string;
    created_by: string;
  }>;
  members?: Array<{
    id: string;
    name: string;
    role: HouseholdMember["role"];
  }>;
};

function numeric(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function isUuid(value: string | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function isMissingRpcError(error: { code?: string } | null) {
  return error?.code === "PGRST202" || error?.code === "42883";
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
  const activeHouseholdId = cookieStore.get("nestly_active_household")?.value;
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
      email:
        cookieStore.get("nestly_demo_email")?.value ||
        demoViewer.profile.email,
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

async function getViewerImpl(): Promise<Viewer | null> {
  if (isDemoMode) {
    return getDemoViewer();
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const claims = authData?.claims;

  if (authError || !claims?.sub) {
    return null;
  }

  const cookieStore = await cookies();
  const activeHouseholdCookie = cookieStore.get(
    "nestly_active_household",
  )?.value;
  const requestedHouseholdId = isUuid(activeHouseholdCookie)
    ? activeHouseholdCookie!
    : null;
  const { data, error } = await supabase.rpc("get_viewer_context", {
    requested_household_id: requestedHouseholdId,
  });

  let context = data as ViewerContextRpc | null;

  if (error && !isMissingRpcError(error)) {
    throw new Error("De gebruikersgegevens konden niet worden geladen.");
  }

  if (error) {
    const [{ data: profile }, { data: memberships }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, locale, currency, accent_color")
        .eq("id", claims.sub)
        .maybeSingle(),
      supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", claims.sub),
    ]);

    let householdRows: Array<{
      id: string;
      name: string;
      invite_code: string;
      currency: string;
    }> = [];

    if (memberships?.length) {
      const result = await supabase
        .from("households")
        .select("id, name, invite_code, currency")
        .in(
          "id",
          memberships.map((membership) => membership.household_id),
        );
      householdRows = result.data ?? [];
    }

    const households =
      memberships?.flatMap((membership) => {
        const row = householdRows.find(
          (householdRow) => householdRow.id === membership.household_id,
        );
        return row
          ? [
              {
                ...row,
                role: membership.role,
              },
            ]
          : [];
      }) ?? [];
    const activeHouseholdId =
      households.find((item) => item.id === activeHouseholdCookie)?.id ??
      households[0]?.id ??
      null;
    const { data: moduleRows } = activeHouseholdId
      ? await supabase
          .from("household_modules")
          .select("module_key")
          .eq("household_id", activeHouseholdId)
          .eq("enabled", true)
      : { data: [] };

    context = {
      profile: profile ?? undefined,
      households,
      active_household_id: activeHouseholdId,
      enabled_modules:
        moduleRows?.map((row) => row.module_key as ModuleKey) ?? [],
    };
  }

  const email = typeof claims.email === "string" ? claims.email : "";
  const metadataName =
    typeof claims.user_metadata?.full_name === "string"
      ? claims.user_metadata.full_name
      : "";
  const households: Household[] =
    context?.households?.map((household) => ({
      id: household.id,
      name: household.name,
      inviteCode: household.invite_code,
      currency: household.currency,
      role: household.role,
    })) ?? [];
  const household =
    households.find(
      (item) => item.id === context?.active_household_id,
    ) ?? null;

  return {
    profile: {
      id: claims.sub,
      fullName:
        context?.profile?.full_name ||
        metadataName ||
        email.split("@")[0] ||
        "",
      email,
      locale: context?.profile?.locale ?? "nl-NL",
      currency: context?.profile?.currency ?? "EUR",
      accentColor: context?.profile?.accent_color ?? "#52796F",
    },
    household,
    households,
    enabledModules: context?.enabled_modules ?? [],
    isDemo: false,
  };
}

export const getViewer = cache(getViewerImpl);

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

function emptyDashboardData(): DashboardData {
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

function mapDashboardData(
  data: DashboardRpc | null,
  viewer: Viewer,
): DashboardData {
  const totalIncome = numeric(data?.total_income);
  const totalExpenses = numeric(data?.total_expenses);
  const monthlyIncome = numeric(data?.monthly_income);
  const monthlyExpenses = numeric(data?.monthly_expenses);

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
      data?.goals?.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: numeric(goal.target_amount),
        currentAmount: numeric(goal.current_amount),
        deadline: goal.deadline,
        color: goal.color,
        icon: goal.icon,
      })) ?? [],
    transactions:
      data?.transactions?.map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        category: transaction.category,
        amount: numeric(transaction.amount),
        transactionDate: transaction.transaction_date,
        type: transaction.type,
      })) ?? [],
    members:
      data?.members?.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.id === viewer.profile.id ? viewer.profile.email : "",
        role: member.role,
      })) ?? [],
  };
}

async function getLegacyDashboardData(
  viewer: Viewer,
  includeGoals: boolean,
  includeMembers: boolean,
): Promise<DashboardData> {
  if (!viewer.household) return emptyDashboardData();

  const supabase = await createClient();
  const householdId = viewer.household.id;
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
    .toISOString()
    .slice(0, 10);

  const goalsQuery = includeGoals
    ? supabase
        .from("savings_goals")
        .select(
          "id, name, target_amount, current_amount, deadline, color, icon",
        )
        .eq("household_id", householdId)
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [] });
  const membershipsQuery = includeMembers
    ? supabase
        .from("household_members")
        .select("user_id, role")
        .eq("household_id", householdId)
    : Promise.resolve({ data: [] });
  const [
    { data: goals },
    { data: recentTransactions },
    { data: allTransactions },
    { data: memberships },
  ] = await Promise.all([
    goalsQuery,
    supabase
      .from("transactions")
      .select(
        "id, description, category, amount, transaction_date, type",
      )
      .eq("household_id", householdId)
      .order("transaction_date", { ascending: false })
      .limit(8),
    supabase
      .from("transactions")
      .select("amount, type, transaction_date")
      .eq("household_id", householdId),
    membershipsQuery,
  ]);

  const memberIds = memberships?.map((member) => member.user_id) ?? [];
  const { data: profiles } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", memberIds)
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
          email:
            member.user_id === viewer.profile.id ? viewer.profile.email : "",
          role: member.role,
        };
      }) ?? [],
  };
}

const getHouseholdDashboardData = cache(
  async (
    viewer: Viewer,
    includeGoals: boolean,
    includeMembers: boolean,
  ): Promise<DashboardData> => {
    if (viewer.isDemo) {
      const data = await getDemoDashboardData();
      return {
        ...data,
        goals: includeGoals ? data.goals : [],
        members: includeMembers ? data.members : [],
      };
    }

    if (!viewer.household) {
      return emptyDashboardData();
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_household_dashboard", {
      target_household_id: viewer.household.id,
      include_goals: includeGoals,
      include_members: includeMembers,
    });

    if (error && isMissingRpcError(error)) {
      return getLegacyDashboardData(viewer, includeGoals, includeMembers);
    }

    if (error) {
      throw new Error("De financiële gegevens konden niet worden geladen.");
    }

    return mapDashboardData(data as DashboardRpc | null, viewer);
  },
);

export function getDashboardData(viewer: Viewer) {
  return getHouseholdDashboardData(viewer, true, true);
}

export function getFinanceOverviewData(viewer: Viewer) {
  return getHouseholdDashboardData(viewer, false, false);
}

export const getSavingsGoalsData = cache(
  async (viewer: Viewer): Promise<SavingsGoal[]> => {
    if (viewer.isDemo) {
      return (await getDemoDashboardData()).goals;
    }

    if (!viewer.household) {
      return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("savings_goals")
      .select(
        "id, name, target_amount, current_amount, deadline, color, icon",
      )
      .eq("household_id", viewer.household.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("De spaardoelen konden niet worden geladen.");
    }

    return (
      data?.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: numeric(goal.target_amount),
        currentAmount: numeric(goal.current_amount),
        deadline: goal.deadline,
        color: goal.color,
        icon: goal.icon,
      })) ?? []
    );
  },
);

function filterDemoAgendaItems(
  items: FinancialAgendaItem[],
  rangeStart: string | null,
  rangeEnd: string | null,
) {
  if (!rangeStart && !rangeEnd) return items;

  return items.filter(
    (item) =>
      (!rangeEnd || item.dueDate <= rangeEnd) &&
      (item.recurrence !== "none" ||
        !rangeStart ||
        item.dueDate >= rangeStart),
  );
}

const getFinancialAgendaDataCached = cache(
  async (
    viewer: Viewer,
    rangeStart: string | null,
    rangeEnd: string | null,
  ): Promise<FinancialAgendaData> => {
    if (viewer.isDemo) {
      const cookieStore = await cookies();
      const customItems = JSON.parse(
        cookieStore.get("nestly_demo_financial_agenda")?.value || "[]",
      ) as FinancialAgendaItem[];

      return {
        items: filterDemoAgendaItems(
          [...demoFinancialAgendaItems, ...customItems],
          rangeStart,
          rangeEnd,
        ),
        members: demoDashboardData.members,
      };
    }

    if (!viewer.household) {
      return { items: [], members: [] };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "get_financial_agenda_context",
      {
        target_household_id: viewer.household.id,
        range_start: rangeStart,
        range_end: rangeEnd,
      },
    );

    if (error && !isMissingRpcError(error)) {
      throw new Error("De financiële agenda kon niet worden geladen.");
    }

    if (!error) {
      const context = data as FinancialAgendaRpc | null;
      return {
        items:
          context?.items?.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            amount: numeric(item.amount),
            type: item.type,
            dueDate: item.due_date,
            recurrence: item.recurrence,
            assignedTo: item.assigned_to,
            assignedToName: item.assigned_to_name,
            createdBy: item.created_by,
          })) ?? [],
        members:
          context?.members?.map((member) => ({
            id: member.id,
            name: member.name,
            email:
              member.id === viewer.profile.id ? viewer.profile.email : "",
            role: member.role,
          })) ?? [],
      };
    }

    const [{ data: agendaItems }, { data: memberships }] = await Promise.all([
      supabase
        .from("financial_agenda_items")
        .select(
          "id, title, category, amount, type, due_date, recurrence, assigned_to, created_by",
        )
        .eq("household_id", viewer.household.id)
        .order("due_date", { ascending: true }),
      supabase
        .from("household_members")
        .select("user_id, role")
        .eq("household_id", viewer.household.id),
    ]);
    const memberIds = memberships?.map((member) => member.user_id) ?? [];
    const { data: profiles } = memberIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", memberIds)
      : { data: [] };
    const members =
      memberships?.map((member) => {
        const profile = profiles?.find((row) => row.id === member.user_id);
        return {
          id: member.user_id,
          name: profile?.full_name || "Huishoudlid",
          email:
            member.user_id === viewer.profile.id ? viewer.profile.email : "",
          role: member.role,
        };
      }) ?? [];

    return {
      items: filterDemoAgendaItems(
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
        rangeStart,
        rangeEnd,
      ),
      members,
    };
  },
);

export function getFinancialAgendaData(
  viewer: Viewer,
  range?: { start: string; end: string },
) {
  return getFinancialAgendaDataCached(
    viewer,
    range?.start ?? null,
    range?.end ?? null,
  );
}

type DemoGroceryLists = Record<string, GroceryItem[]>;

export const getGroceryItems = cache(
  async (viewer: Viewer): Promise<GroceryItem[]> => {
    if (!viewer.household) return [];

    if (viewer.isDemo) {
      const cookieStore = await cookies();
      const raw = cookieStore.get("nestly_demo_groceries")?.value;

      if (raw) {
        try {
          const lists = JSON.parse(raw) as DemoGroceryLists;
          if (lists[viewer.household.id]) {
            return lists[viewer.household.id];
          }
        } catch {
          // Fall back to the stable demo list when the cookie is malformed.
        }
      }

      return demoGroceryItems.map((item) => ({ ...item }));
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("grocery_items")
      .select(
        "id, name, quantity, category, completed, added_by, completed_by, completed_at, created_at",
      )
      .eq("household_id", viewer.household.id)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("De boodschappenlijst kon niet worden geladen.");
    }

    return (
      data?.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        completed: item.completed,
        addedBy: item.added_by,
        completedBy: item.completed_by,
        completedAt: item.completed_at,
        createdAt: item.created_at,
      })) ?? []
    );
  },
);

type DemoMealPrepLists = Record<string, MealPrepRecipe[]>;

export const getMealPrepRecipes = cache(
  async (viewer: Viewer): Promise<MealPrepRecipe[]> => {
    if (!viewer.household) return [];

    if (viewer.isDemo) {
      const cookieStore = await cookies();
      const raw = cookieStore.get("nestly_demo_meal_prep")?.value;

      if (raw) {
        try {
          const lists = JSON.parse(raw) as DemoMealPrepLists;
          if (lists[viewer.household.id]) {
            return lists[viewer.household.id];
          }
        } catch {
          // Fall back to the stable demo recipes when the cookie is malformed.
        }
      }

      return demoMealPrepRecipes.map((recipe) => ({
        ...recipe,
        ingredients: [...recipe.ingredients],
      }));
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("meal_prep_recipes")
      .select(
        "id, name, description, ingredients, instructions, servings, prep_minutes, storage_method, shelf_life_days, last_prepared_at, created_by, created_at",
      )
      .eq("household_id", viewer.household.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("De mealprep-gerechten konden niet worden geladen.");
    }

    return (
      data?.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        servings: recipe.servings,
        prepMinutes: recipe.prep_minutes,
        storageMethod: recipe.storage_method,
        shelfLifeDays: recipe.shelf_life_days,
        lastPreparedAt: recipe.last_prepared_at,
        createdBy: recipe.created_by,
        createdAt: recipe.created_at,
      })) ?? []
    );
  },
);
