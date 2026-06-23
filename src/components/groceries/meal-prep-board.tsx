"use client";

import {
  CalendarClock,
  ChefHat,
  Clock3,
  CookingPot,
  Plus,
  Refrigerator,
  RotateCcw,
  Snowflake,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  createMealPrepRecipeAction,
  deleteMealPrepRecipeAction,
  markMealPreparedAction,
} from "@/actions/meal-prep";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { cn, formatDate } from "@/lib/utils";
import type {
  ActionState,
  MealPrepRecipe,
  MealStorageMethod,
} from "@/types/app";

const initialState: ActionState = {};
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const storageConfig = {
  fridge: {
    label: "Koelkast",
    icon: Refrigerator,
    className: "bg-sky-50 text-sky-700",
  },
  freezer: {
    label: "Vriezer",
    icon: Snowflake,
    className: "bg-cyan-50 text-cyan-700",
  },
  room_temperature: {
    label: "Kamertemperatuur",
    icon: CookingPot,
    className: "bg-amber-50 text-amber-700",
  },
} satisfies Record<
  MealStorageMethod,
  { label: string; icon: typeof Refrigerator; className: string }
>;

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--accent)_16%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

function CreateRecipeButton() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    createMealPrepRecipeAction,
    initialState,
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Gerecht opslaan
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xl"
        title="Mealprep-gerecht opslaan"
        description="Bewaar alles wat je nodig hebt om dit gerecht later zonder nadenken opnieuw te maken."
      >
        <form action={action} className="space-y-5">
          <ActionMessage error={state.error} success={state.success} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Naam van het gerecht"
              error={state.fieldErrors?.name?.[0]}
            >
              <Input
                name="name"
                placeholder="Bijvoorbeeld vegetarische chili"
                required
              />
            </Field>
            <Field
              label="Korte omschrijving"
              error={state.fieldErrors?.description?.[0]}
            >
              <Input
                name="description"
                placeholder="Waarom dit een blijvertje is"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Ingrediënten"
              hint="Zet ieder ingrediënt op een eigen regel."
              error={state.fieldErrors?.ingredients?.[0]}
            >
              <Textarea
                name="ingredients"
                placeholder={"300 g pasta\n1 courgette\n4 el pesto"}
                required
              />
            </Field>
            <Field
              label="Bereiding"
              hint="Een korte volgorde is genoeg."
              error={state.fieldErrors?.instructions?.[0]}
            >
              <Textarea
                name="instructions"
                placeholder="Kook de pasta, bak de groenten en meng alles met de pesto."
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Porties"
              error={state.fieldErrors?.servings?.[0]}
            >
              <Input
                name="servings"
                type="number"
                min="1"
                max="30"
                defaultValue="4"
                required
              />
            </Field>
            <Field
              label="Bereidingstijd"
              hint="In minuten"
              error={state.fieldErrors?.prepMinutes?.[0]}
            >
              <Input
                name="prepMinutes"
                type="number"
                min="1"
                max="1440"
                defaultValue="30"
                required
              />
            </Field>
            <Field
              label="Bewaren in"
              error={state.fieldErrors?.storageMethod?.[0]}
            >
              <Select name="storageMethod" defaultValue="fridge">
                <option value="fridge">Koelkast</option>
                <option value="freezer">Vriezer</option>
                <option value="room_temperature">Kamertemperatuur</option>
              </Select>
            </Field>
            <Field
              label="Goed voor"
              hint="Aantal dagen"
              error={state.fieldErrors?.shelfLifeDays?.[0]}
            >
              <Input
                name="shelfLifeDays"
                type="number"
                min="1"
                max="365"
                defaultValue="3"
                required
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton pendingLabel="Opslaan...">
              Gerecht opslaan
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

function getFreshness(recipe: MealPrepRecipe, locale: string) {
  if (!recipe.lastPreparedAt) {
    return {
      label: "Nog niet bereid",
      detail: `Na bereiding ${recipe.shelfLifeDays} ${
        recipe.shelfLifeDays === 1 ? "dag" : "dagen"
      } goed`,
      className: "bg-slate-100 text-slate-600",
    };
  }

  const bestBefore = new Date(
    new Date(recipe.lastPreparedAt).getTime() +
      recipe.shelfLifeDays * DAY_IN_MS,
  );
  const today = new Date();
  const daysRemaining = Math.ceil(
    (bestBefore.getTime() - today.getTime()) / DAY_IN_MS,
  );

  if (daysRemaining < 0) {
    return {
      label: "Niet meer goed",
      detail: `Was goed tot ${formatDate(bestBefore, locale)}`,
      className: "bg-red-50 text-red-700",
    };
  }

  if (daysRemaining === 0) {
    return {
      label: "Vandaag gebruiken",
      detail: `Goed tot ${formatDate(bestBefore, locale)}`,
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: daysRemaining === 1 ? "Nog 1 dag goed" : `Nog ${daysRemaining} dagen goed`,
    detail: `Goed tot ${formatDate(bestBefore, locale)}`,
    className: "bg-emerald-50 text-emerald-700",
  };
}

function RecipeCard({
  recipe,
  locale,
  onPrepared,
  onDelete,
  pending,
}: {
  recipe: MealPrepRecipe;
  locale: string;
  onPrepared: (recipe: MealPrepRecipe) => void;
  onDelete: (recipe: MealPrepRecipe) => void;
  pending: boolean;
}) {
  const storage = storageConfig[recipe.storageMethod];
  const freshness = getFreshness(recipe, locale);

  return (
    <Card
      className={cn(
        "group flex min-h-[390px] flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]",
        pending && "pointer-events-none opacity-65",
      )}
    >
      <div className="relative overflow-hidden border-b border-slate-100 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent)_12%,white),white_70%)] p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent)] text-white shadow-sm">
            <ChefHat className="size-5" />
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              freshness.className,
            )}
          >
            {freshness.label}
          </span>
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-[-0.025em] text-slate-950">
          {recipe.name}
        </h2>
        <p className="mt-1.5 min-h-10 text-sm leading-5 text-slate-500">
          {recipe.description || "Een vertrouwd gerecht om opnieuw te maken."}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <Clock3 className="mx-auto size-4 text-slate-400" />
            <p className="mt-1 text-xs font-semibold text-slate-700">
              {recipe.prepMinutes} min
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <UsersRound className="mx-auto size-4 text-slate-400" />
            <p className="mt-1 text-xs font-semibold text-slate-700">
              {recipe.servings} porties
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <storage.icon
              className={cn("mx-auto size-4", storage.className.split(" ")[1])}
            />
            <p className="mt-1 truncate text-xs font-semibold text-slate-700">
              {storage.label}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-700">
                {freshness.detail}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {recipe.shelfLifeDays}{" "}
                {recipe.shelfLifeDays === 1 ? "dag" : "dagen"} houdbaar in de{" "}
                {storage.label.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <details className="group/details mt-4">
          <summary className="cursor-pointer list-none text-xs font-semibold text-[var(--accent)]">
            Ingrediënten en bereiding bekijken
          </summary>
          <div className="mt-3 space-y-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Ingrediënten
              </p>
              <ul className="mt-2 space-y-1.5">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={`${recipe.id}-${index}`}
                    className="flex gap-2 text-xs leading-5 text-slate-600"
                  >
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--accent)]" />
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>
            {recipe.instructions && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Bereiding
                </p>
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">
                  {recipe.instructions}
                </p>
              </div>
            )}
          </div>
        </details>
      </div>

      <div className="flex gap-2 border-t border-slate-100 bg-slate-50/60 p-4">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onPrepared(recipe)}
        >
          <RotateCcw className="size-4" />
          Opnieuw gemaakt
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(recipe)}
          aria-label={`${recipe.name} verwijderen`}
          className="text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

export function MealPrepBoard({
  initialRecipes,
  locale,
}: {
  initialRecipes: MealPrepRecipe[];
  locale: string;
}) {
  const router = useRouter();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [error, setError] = useState<string>();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function markPending(recipeId: string, pending: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(recipeId);
      else next.delete(recipeId);
      return next;
    });
  }

  function markPrepared(recipe: MealPrepRecipe) {
    const previous = recipes;
    const preparedAt = new Date().toISOString();
    setError(undefined);
    setRecipes((current) =>
      current.map((item) =>
        item.id === recipe.id
          ? { ...item, lastPreparedAt: preparedAt }
          : item,
      ),
    );
    markPending(recipe.id, true);

    startTransition(async () => {
      const result = await markMealPreparedAction(recipe.id);
      if (result.error) {
        setRecipes(previous);
        setError(result.error);
      }
      markPending(recipe.id, false);
      router.refresh();
    });
  }

  function deleteRecipe(recipe: MealPrepRecipe) {
    const previous = recipes;
    setError(undefined);
    setRecipes((current) =>
      current.filter((item) => item.id !== recipe.id),
    );
    markPending(recipe.id, true);

    startTransition(async () => {
      const result = await deleteMealPrepRecipeAction(recipe.id);
      if (result.error) {
        setRecipes(previous);
        setError(result.error);
      }
      markPending(recipe.id, false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {recipes.length}{" "}
            {recipes.length === 1 ? "bewaard gerecht" : "bewaarde gerechten"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Je eigen kleine repertoire voor drukke dagen.
          </p>
        </div>
        <CreateRecipeButton />
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {recipes.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              locale={locale}
              onPrepared={markPrepared}
              onDelete={deleteRecipe}
              pending={pendingIds.has(recipe.id)}
            />
          ))}
        </section>
      ) : (
        <Card className="grid min-h-[420px] place-items-center p-8 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
              <CookingPot className="size-7" />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Bewaar je eerste blijvertje
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sla een gerecht op dat je graag opnieuw maakt, inclusief
              ingrediënten en houdbaarheid.
            </p>
            <div className="mt-5 flex justify-center">
              <CreateRecipeButton />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
