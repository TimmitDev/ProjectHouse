export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          locale: string;
          currency: string;
          accent_color: string;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          locale?: string;
          currency?: string;
          accent_color?: string;
          onboarding_complete?: boolean;
        };
        Update: {
          full_name?: string;
          locale?: string;
          currency?: string;
          accent_color?: string;
          onboarding_complete?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          currency: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          currency?: string;
          created_by: string;
        };
        Update: {
          name?: string;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
        };
        Update: {
          role?: "owner" | "admin" | "member";
        };
        Relationships: [];
      };
      household_modules: {
        Row: {
          household_id: string;
          module_key: "finances" | "calendar" | "chores" | "groceries";
          enabled: boolean;
          updated_at: string;
        };
        Insert: {
          household_id: string;
          module_key: "finances" | "calendar" | "chores" | "groceries";
          enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          color: string;
          icon: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          deadline?: string | null;
          color?: string;
          icon?: string;
          created_by: string;
        };
        Update: {
          name?: string;
          target_amount?: number;
          current_amount?: number;
          deadline?: string | null;
          color?: string;
          icon?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          description: string;
          category: string;
          amount: number;
          type: "income" | "expense";
          transaction_date: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          description: string;
          category: string;
          amount: number;
          type: "income" | "expense";
          transaction_date?: string;
          created_by: string;
        };
        Update: {
          description?: string;
          category?: string;
          amount?: number;
          type?: "income" | "expense";
          transaction_date?: string;
        };
        Relationships: [];
      };
      financial_agenda_items: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          category: string;
          amount: number;
          type: "income" | "expense";
          due_date: string;
          recurrence: "none" | "weekly" | "monthly" | "yearly";
          budget_month_offset: number;
          assigned_to: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          category: string;
          amount: number;
          type: "income" | "expense";
          due_date: string;
          recurrence?: "none" | "weekly" | "monthly" | "yearly";
          budget_month_offset?: number;
          assigned_to: string;
          created_by: string;
        };
        Update: {
          title?: string;
          category?: string;
          amount?: number;
          type?: "income" | "expense";
          due_date?: string;
          recurrence?: "none" | "weekly" | "monthly" | "yearly";
          budget_month_offset?: number;
          assigned_to?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      grocery_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          quantity: string;
          category:
            | "produce"
            | "bakery"
            | "dairy"
            | "meat"
            | "pantry"
            | "frozen"
            | "drinks"
            | "household"
            | "other";
          completed: boolean;
          added_by: string | null;
          completed_by: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          quantity?: string;
          category?:
            | "produce"
            | "bakery"
            | "dairy"
            | "meat"
            | "pantry"
            | "frozen"
            | "drinks"
            | "household"
            | "other";
          completed?: boolean;
          added_by?: string | null;
          completed_by?: string | null;
          completed_at?: string | null;
        };
        Update: {
          name?: string;
          quantity?: string;
          category?:
            | "produce"
            | "bakery"
            | "dairy"
            | "meat"
            | "pantry"
            | "frozen"
            | "drinks"
            | "household"
            | "other";
          completed?: boolean;
          completed_by?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_prep_recipes: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          description: string;
          ingredients: string[];
          instructions: string;
          servings: number;
          prep_minutes: number;
          storage_method: "fridge" | "freezer" | "room_temperature";
          shelf_life_days: number;
          last_prepared_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          description?: string;
          ingredients: string[];
          instructions?: string;
          servings?: number;
          prep_minutes?: number;
          storage_method?: "fridge" | "freezer" | "room_temperature";
          shelf_life_days?: number;
          last_prepared_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          description?: string;
          ingredients?: string[];
          instructions?: string;
          servings?: number;
          prep_minutes?: number;
          storage_method?: "fridge" | "freezer" | "room_temperature";
          shelf_life_days?: number;
          last_prepared_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_household: {
        Args: { household_name: string; household_currency: string };
        Returns: string;
      };
      create_additional_household: {
        Args: { household_name: string; household_currency: string };
        Returns: string;
      };
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      join_household: {
        Args: { household_code: string };
        Returns: string;
      };
      contribute_to_savings_goal: {
        Args: { goal_id: string; contribution_amount: number };
        Returns: number;
      };
      get_viewer_context: {
        Args: { requested_household_id: string | null };
        Returns: Json;
      };
      get_household_dashboard: {
        Args: {
          target_household_id: string;
          include_goals: boolean;
          include_members: boolean;
        };
        Returns: Json;
      };
      get_financial_agenda_context: {
        Args: {
          target_household_id: string;
          range_start: string | null;
          range_end: string | null;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
