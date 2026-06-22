import type {
  DashboardData,
  FinancialAgendaItem,
  ModuleKey,
  SavingsGoal,
  Viewer,
} from "@/types/app";

export const demoViewer: Viewer = {
  profile: {
    id: "demo-user",
    fullName: "Alex Morgan",
    email: "alex@example.com",
    locale: "nl-NL",
    currency: "EUR",
    accentColor: "#52796F",
  },
  household: {
    id: "demo-household",
    name: "Huishouden Morgan",
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
    name: "Zomervakantie",
    targetAmount: 5000,
    currentAmount: 3250,
    deadline: "2026-08-01",
    color: "#52796F",
    icon: "plane",
  },
  {
    id: "goal-emergency",
    name: "Noodfonds",
    targetAmount: 10000,
    currentAmount: 4800,
    deadline: "2026-12-31",
    color: "#D49A73",
    icon: "shield",
  },
  {
    id: "goal-kitchen",
    name: "Nieuwe keuken",
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
      description: "Maandsalaris",
      category: "Inkomsten",
      amount: 4200,
      transactionDate: "2026-06-21",
      type: "income",
    },
    {
      id: "transaction-2",
      description: "Supermarkt",
      category: "Boodschappen",
      amount: 86.4,
      transactionDate: "2026-06-20",
      type: "expense",
    },
    {
      id: "transaction-3",
      description: "Energierekening",
      category: "Vaste lasten",
      amount: 142.8,
      transactionDate: "2026-06-18",
      type: "expense",
    },
    {
      id: "transaction-4",
      description: "Zomervakantie",
      category: "Sparen",
      amount: 350,
      transactionDate: "2026-06-16",
      type: "expense",
    },
  ],
};

export const demoFinancialAgendaItems: FinancialAgendaItem[] = [
  {
    id: "agenda-rent",
    title: "Huur",
    category: "Wonen",
    amount: 1450,
    type: "expense",
    dueDate: "2026-01-01",
    recurrence: "monthly",
    assignedTo: "demo-user",
    assignedToName: "Alex Morgan",
    createdBy: "demo-user",
  },
  {
    id: "agenda-energy",
    title: "Energie",
    category: "Vaste lasten",
    amount: 142.8,
    type: "expense",
    dueDate: "2026-01-18",
    recurrence: "monthly",
    assignedTo: "demo-member",
    assignedToName: "Jamie Morgan",
    createdBy: "demo-user",
  },
  {
    id: "agenda-salary",
    title: "Salaris",
    category: "Inkomsten",
    amount: 4200,
    type: "income",
    dueDate: "2026-01-25",
    recurrence: "monthly",
    assignedTo: "demo-user",
    assignedToName: "Alex Morgan",
    createdBy: "demo-user",
  },
  {
    id: "agenda-insurance",
    title: "Autoverzekering",
    category: "Vervoer",
    amount: 83.5,
    type: "expense",
    dueDate: "2026-06-28",
    recurrence: "none",
    assignedTo: "demo-member",
    assignedToName: "Jamie Morgan",
    createdBy: "demo-member",
  },
];

export const moduleCatalog: Array<{
  key: ModuleKey;
  name: string;
  description: string;
  icon: "wallet" | "calendar" | "sparkles" | "shopping";
  available: boolean;
}> = [
  {
    key: "finances",
    name: "Financiën",
    description: "Beheer uitgaven, saldo en gezamenlijke spaardoelen.",
    icon: "wallet",
    available: true,
  },
  {
    key: "calendar",
    name: "Gedeelde agenda",
    description: "Houd iedereen op de hoogte van plannen en afspraken.",
    icon: "calendar",
    available: false,
  },
  {
    key: "chores",
    name: "Huishoudelijke taken",
    description: "Verdeel terugkerende taken en deel het werk.",
    icon: "sparkles",
    available: false,
  },
  {
    key: "groceries",
    name: "Boodschappen",
    description: "Maak samen één actuele boodschappenlijst.",
    icon: "shopping",
    available: false,
  },
];
