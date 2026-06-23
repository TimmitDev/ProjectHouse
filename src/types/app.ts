export type HouseholdRole = "owner" | "admin" | "member";

export type ModuleKey = "finances" | "calendar" | "chores" | "groceries";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  locale: string;
  currency: string;
  accentColor: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  currency: string;
  role: HouseholdRole;
}

export interface Viewer {
  profile: Profile;
  household: Household | null;
  households: Household[];
  enabledModules: ModuleKey[];
  isDemo: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  role: HouseholdRole;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  transactionDate: string;
  type: "income" | "expense";
}

export type FinancialRecurrence = "none" | "weekly" | "monthly" | "yearly";

export interface FinancialAgendaItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  dueDate: string;
  recurrence: FinancialRecurrence;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
}

export interface FinancialAgendaOccurrence extends FinancialAgendaItem {
  occurrenceDate: string;
}

export interface FinancialAgendaData {
  items: FinancialAgendaItem[];
  members: HouseholdMember[];
}

export type GroceryCategory =
  | "produce"
  | "bakery"
  | "dairy"
  | "meat"
  | "pantry"
  | "frozen"
  | "drinks"
  | "household"
  | "other";

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: GroceryCategory;
  completed: boolean;
  addedBy: string | null;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface DashboardData {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  goals: SavingsGoal[];
  transactions: Transaction[];
  members: HouseholdMember[];
}

export interface ActionState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}
