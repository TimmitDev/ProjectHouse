import type {
  DashboardData,
  ModuleKey,
  SavingsGoal,
  Viewer,
} from "@/types/app";

export const demoViewer: Viewer = {
  profile: {
    id: "demo-user",
    fullName: "Alex Morgan",
    email: "alex@example.com",
    locale: "en-US",
    currency: "EUR",
    accentColor: "#52796F",
  },
  household: {
    id: "demo-household",
    name: "The Morgan Home",
    inviteCode: "NEST-4821",
    currency: "EUR",
    role: "owner",
  },
  enabledModules: ["finances"],
  isDemo: true,
};

export const demoGoals: SavingsGoal[] = [
  {
    id: "goal-summer",
    name: "Summer getaway",
    targetAmount: 5000,
    currentAmount: 3250,
    deadline: "2026-08-01",
    color: "#52796F",
    icon: "plane",
  },
  {
    id: "goal-emergency",
    name: "Emergency fund",
    targetAmount: 10000,
    currentAmount: 4800,
    deadline: "2026-12-31",
    color: "#D49A73",
    icon: "shield",
  },
  {
    id: "goal-kitchen",
    name: "New kitchen",
    targetAmount: 15000,
    currentAmount: 2100,
    deadline: "2027-06-01",
    color: "#6F7FA3",
    icon: "home",
  },
];

export const demoDashboardData: DashboardData = {
  balance: 12480,
  monthlyIncome: 6840,
  monthlyExpenses: 4210,
  monthlySavings: 2630,
  savingsRate: 38,
  goals: demoGoals,
  members: [
    {
      id: "demo-user",
      name: "Alex Morgan",
      email: "alex@example.com",
      role: "owner",
    },
    {
      id: "demo-member",
      name: "Jamie Morgan",
      email: "jamie@example.com",
      role: "member",
    },
  ],
  transactions: [
    {
      id: "transaction-1",
      description: "Monthly salary",
      category: "Income",
      amount: 4200,
      transactionDate: "2026-06-21",
      type: "income",
    },
    {
      id: "transaction-2",
      description: "Whole Foods Market",
      category: "Groceries",
      amount: 86.4,
      transactionDate: "2026-06-20",
      type: "expense",
    },
    {
      id: "transaction-3",
      description: "Energy bill",
      category: "Utilities",
      amount: 142.8,
      transactionDate: "2026-06-18",
      type: "expense",
    },
    {
      id: "transaction-4",
      description: "Summer getaway",
      category: "Savings",
      amount: 350,
      transactionDate: "2026-06-16",
      type: "expense",
    },
  ],
};

export const moduleCatalog: Array<{
  key: ModuleKey;
  name: string;
  description: string;
  icon: "wallet" | "calendar" | "sparkles" | "shopping";
  available: boolean;
}> = [
  {
    key: "finances",
    name: "Finances",
    description: "Track spending, balances and shared savings goals.",
    icon: "wallet",
    available: true,
  },
  {
    key: "calendar",
    name: "Shared calendar",
    description: "Keep everyone aligned on plans and appointments.",
    icon: "calendar",
    available: false,
  },
  {
    key: "chores",
    name: "Chores",
    description: "Assign recurring tasks and share the workload.",
    icon: "sparkles",
    available: false,
  },
  {
    key: "groceries",
    name: "Groceries",
    description: "Build one live shopping list for the household.",
    icon: "shopping",
    available: false,
  },
];
