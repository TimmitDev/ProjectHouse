"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getViewer } from "@/lib/data";
import { demoHouseholdNotes } from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  HouseholdNote,
  HouseholdNoteCategory,
} from "@/types/app";

const noteCategories = [
  "general",
  "home",
  "finance",
  "shopping",
  "maintenance",
  "important",
  "other",
] as const satisfies readonly HouseholdNoteCategory[];

const noteSchema = z.object({
  title: z.string().trim().min(1, "Vul een titel in.").max(120),
  body: z.string().trim().min(1, "Vul een notitie in.").max(3000),
  category: z.enum(noteCategories),
  pinned: z.boolean(),
});

type DemoNoteLists = Record<string, HouseholdNote[]>;

async function getDemoLists() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("nestly_demo_notes")?.value;

  if (!raw) return { cookieStore, lists: {} as DemoNoteLists };

  try {
    return {
      cookieStore,
      lists: JSON.parse(raw) as DemoNoteLists,
    };
  } catch {
    return { cookieStore, lists: {} as DemoNoteLists };
  }
}

function getDemoList(lists: DemoNoteLists, householdId: string) {
  return lists[householdId]
    ? [...lists[householdId]]
    : demoHouseholdNotes.map((note) => ({ ...note }));
}

function saveDemoLists(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  lists: DemoNoteLists,
) {
  cookieStore.set("nestly_demo_notes", JSON.stringify(lists), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function createNoteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    pinned: formData.get("pinned") === "on",
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gegevens van de notitie.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  const now = new Date().toISOString();

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const notes = getDemoList(lists, viewer.household.id);
    notes.unshift({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      pinned: parsed.data.pinned,
      createdBy: viewer.profile.id,
      createdByName: viewer.profile.fullName,
      createdAt: now,
      updatedAt: now,
    });
    lists[viewer.household.id] = notes;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("household_notes").insert({
      household_id: viewer.household.id,
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      pinned: parsed.data.pinned,
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: "De notitie kon niet worden opgeslagen." };
    }
  }

  revalidatePath("/notes");
  return { success: "Notitie opgeslagen." };
}

export async function toggleNotePinnedAction(noteId: string, pinned: boolean) {
  if (!noteId) return { error: "Notitie ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  const updatedAt = new Date().toISOString();

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const notes = getDemoList(lists, viewer.household.id);
    const note = notes.find((item) => item.id === noteId);

    if (!note) return { error: "Notitie niet gevonden." };

    note.pinned = pinned;
    note.updatedAt = updatedAt;
    lists[viewer.household.id] = notes;
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("household_notes")
      .update({ pinned, updated_at: updatedAt })
      .eq("id", noteId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De notitie kon niet worden bijgewerkt." };
    }
  }

  revalidatePath("/notes");
  return { success: true };
}

export async function deleteNoteAction(noteId: string) {
  if (!noteId) return { error: "Notitie ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, lists } = await getDemoLists();
    const notes = getDemoList(lists, viewer.household.id);
    lists[viewer.household.id] = notes.filter((note) => note.id !== noteId);
    saveDemoLists(cookieStore, lists);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("household_notes")
      .delete()
      .eq("id", noteId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De notitie kon niet worden verwijderd." };
    }
  }

  revalidatePath("/notes");
  return { success: true };
}
