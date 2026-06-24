"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getCalendarEvents, getViewer } from "@/lib/data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionState,
  CalendarEvent,
  CalendarEventCategory,
} from "@/types/app";

const calendarCategories = [
  "home",
  "appointment",
  "school",
  "work",
  "social",
  "health",
  "travel",
  "other",
] as const satisfies readonly CalendarEventCategory[];

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Gebruik een geldige tijd.")
  .or(z.literal(""));

const calendarEventSchema = z
  .object({
    title: z.string().trim().min(1, "Vul een titel in.").max(120),
    description: z.string().trim().max(500).default(""),
    location: z.string().trim().max(160).default(""),
    eventDate: z.iso.date(),
    startTime: timeSchema,
    endTime: timeSchema,
    allDay: z.boolean(),
    category: z.enum(calendarCategories),
  })
  .superRefine((event, context) => {
    if (event.allDay) return;

    if (!event.startTime) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Kies een begintijd of markeer de afspraak als hele dag.",
      });
    }

    if (
      event.startTime &&
      event.endTime &&
      event.endTime <= event.startTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "De eindtijd moet na de begintijd liggen.",
      });
    }
  });

type DemoCalendarEvents = Record<string, CalendarEvent[]>;

async function getDemoEvents() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("nestly_demo_calendar_events")?.value;

  if (!raw) return { cookieStore, eventsByHousehold: {} as DemoCalendarEvents };

  try {
    return {
      cookieStore,
      eventsByHousehold: JSON.parse(raw) as DemoCalendarEvents,
    };
  } catch {
    return { cookieStore, eventsByHousehold: {} as DemoCalendarEvents };
  }
}

function saveDemoEvents(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  eventsByHousehold: DemoCalendarEvents,
) {
  cookieStore.set(
    "nestly_demo_calendar_events",
    JSON.stringify(eventsByHousehold),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
}

export async function createCalendarEventAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const allDay = formData.get("allDay") === "on";
  const parsed = calendarEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    location: formData.get("location") || "",
    eventDate: formData.get("eventDate"),
    startTime: allDay ? "" : formData.get("startTime") || "",
    endTime: allDay ? "" : formData.get("endTime") || "",
    allDay,
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return {
      error: "Controleer de gegevens van de afspraak.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  const startTime = parsed.data.allDay ? null : parsed.data.startTime;
  const endTime =
    parsed.data.allDay || !parsed.data.endTime ? null : parsed.data.endTime;

  if (isDemoMode) {
    const { cookieStore, eventsByHousehold } = await getDemoEvents();
    const events = await getCalendarEvents(viewer);
    events.unshift({
      id: crypto.randomUUID(),
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      eventDate: parsed.data.eventDate,
      startTime,
      endTime,
      allDay: parsed.data.allDay,
      category: parsed.data.category,
      createdBy: viewer.profile.id,
      createdByName: viewer.profile.fullName,
      createdAt: new Date().toISOString(),
    });
    eventsByHousehold[viewer.household.id] = events;
    saveDemoEvents(cookieStore, eventsByHousehold);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("calendar_events").insert({
      household_id: viewer.household.id,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      event_date: parsed.data.eventDate,
      start_time: startTime,
      end_time: endTime,
      all_day: parsed.data.allDay,
      category: parsed.data.category,
      created_by: viewer.profile.id,
    });

    if (error) {
      return { error: "De afspraak kon niet worden opgeslagen." };
    }
  }

  revalidatePath("/calendar");
  return { success: "Afspraak toegevoegd." };
}

export async function deleteCalendarEventAction(eventId: string) {
  if (!eventId) return { error: "Afspraak ontbreekt." };

  const viewer = await getViewer();
  if (!viewer?.household) {
    return { error: "Geen huishouden gevonden." };
  }

  if (isDemoMode) {
    const { cookieStore, eventsByHousehold } = await getDemoEvents();
    const events = await getCalendarEvents(viewer);
    eventsByHousehold[viewer.household.id] = events.filter(
      (event) => event.id !== eventId,
    );
    saveDemoEvents(cookieStore, eventsByHousehold);
  } else {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is niet geconfigureerd." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
      .eq("household_id", viewer.household.id);

    if (error) {
      return { error: "De afspraak kon niet worden verwijderd." };
    }
  }

  revalidatePath("/calendar");
  return { success: true };
}
