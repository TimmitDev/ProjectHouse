"use client";

import {
  Apple,
  Beef,
  Check,
  Croissant,
  CupSoda,
  Milk,
  Package,
  Plus,
  ShoppingBasket,
  Snowflake,
  SprayCan,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  addGroceryItemAction,
  clearCompletedGroceriesAction,
  deleteGroceryItemAction,
  toggleGroceryItemAction,
} from "@/actions/groceries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ActionMessage,
  Field,
  Input,
  Select,
  SubmitButton,
} from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import type {
  ActionState,
  GroceryCategory,
  GroceryItem,
} from "@/types/app";

const initialState: ActionState = {};

const categoryConfig = {
  produce: {
    label: "Groente & fruit",
    icon: Apple,
    color: "bg-emerald-50 text-emerald-700",
  },
  bakery: {
    label: "Brood & bakkerij",
    icon: Croissant,
    color: "bg-amber-50 text-amber-700",
  },
  dairy: {
    label: "Zuivel",
    icon: Milk,
    color: "bg-sky-50 text-sky-700",
  },
  meat: {
    label: "Vlees & vis",
    icon: Beef,
    color: "bg-rose-50 text-rose-700",
  },
  pantry: {
    label: "Voorraadkast",
    icon: Package,
    color: "bg-orange-50 text-orange-700",
  },
  frozen: {
    label: "Diepvries",
    icon: Snowflake,
    color: "bg-cyan-50 text-cyan-700",
  },
  drinks: {
    label: "Dranken",
    icon: CupSoda,
    color: "bg-violet-50 text-violet-700",
  },
  household: {
    label: "Huishouden",
    icon: SprayCan,
    color: "bg-slate-100 text-slate-700",
  },
  other: {
    label: "Overig",
    icon: ShoppingBasket,
    color: "bg-stone-100 text-stone-700",
  },
} satisfies Record<
  GroceryCategory,
  {
    label: string;
    icon: typeof ShoppingBasket;
    color: string;
  }
>;

const categoryOrder = Object.keys(categoryConfig) as GroceryCategory[];

function AddGroceryForm() {
  const [state, action] = useActionState(
    addGroceryItemAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent)_10%,white),white_65%)] p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
          <Plus className="size-5" />
        </span>
        <h2 className="mt-4 font-semibold text-slate-900">
          Product toevoegen
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Voeg iets toe en iedereen thuis ziet het meteen.
        </p>
      </div>

      <form ref={formRef} action={action} className="space-y-4 p-5">
        <ActionMessage error={state.error} success={state.success} />
        <Field
          label="Wat heb je nodig?"
          error={state.fieldErrors?.name?.[0]}
        >
          <Input
            name="name"
            placeholder="Bijvoorbeeld bananen"
            autoComplete="off"
            required
          />
        </Field>
        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
          <Field
            label="Categorie"
            error={state.fieldErrors?.category?.[0]}
          >
            <Select name="category" defaultValue="produce">
              {categoryOrder.map((category) => (
                <option key={category} value={category}>
                  {categoryConfig[category].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Hoeveel"
            error={state.fieldErrors?.quantity?.[0]}
          >
            <Input
              name="quantity"
              defaultValue="1"
              placeholder="1"
              autoComplete="off"
              required
            />
          </Field>
        </div>
        <SubmitButton className="w-full" pendingLabel="Toevoegen...">
          <Plus className="size-4" />
          Aan lijst toevoegen
        </SubmitButton>
      </form>
    </Card>
  );
}

function GroceryRow({
  item,
  onToggle,
  onDelete,
  pending,
}: {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onDelete: (item: GroceryItem) => void;
  pending: boolean;
}) {
  const category = categoryConfig[item.category];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3.5 transition sm:px-5",
        item.completed ? "bg-slate-50/60" : "hover:bg-slate-50/70",
        pending && "pointer-events-none opacity-60",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.completed}
        aria-label={`${item.name} ${item.completed ? "terugzetten" : "afvinken"}`}
        onClick={() => onToggle(item)}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
          item.completed
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-slate-300 bg-white text-transparent hover:border-[var(--accent)]",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>

      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          category.color,
          item.completed && "grayscale opacity-60",
        )}
      >
        <category.icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-slate-800 transition",
            item.completed && "text-slate-400 line-through",
          )}
        >
          {item.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {category.label}
        </p>
      </div>

      <span
        className={cn(
          "max-w-28 truncate rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600",
          item.completed && "text-slate-400",
        )}
        title={item.quantity}
      >
        {item.quantity}
      </span>

      <button
        type="button"
        onClick={() => onDelete(item)}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        aria-label={`${item.name} verwijderen`}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function GroceryBoard({
  initialItems,
}: {
  initialItems: GroceryItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string>();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [clearing, startClearing] = useTransition();

  const openItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);
  const total = items.length;
  const completionPercentage = total
    ? Math.round((completedItems.length / total) * 100)
    : 0;

  async function mutateItem(
    item: GroceryItem,
    mutation: () => Promise<{ error?: string }>,
    optimisticItems: GroceryItem[],
  ) {
    const previousItems = items;
    setError(undefined);
    setItems(optimisticItems);
    setPendingIds((current) => new Set(current).add(item.id));

    const result = await mutation();
    if (result.error) {
      setItems(previousItems);
      setError(result.error);
    }

    setPendingIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    router.refresh();
  }

  function toggleItem(item: GroceryItem) {
    const completed = !item.completed;
    const optimisticItems = items.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            completed,
            completedAt: completed ? new Date().toISOString() : null,
          }
        : entry,
    );

    void mutateItem(
      item,
      () => toggleGroceryItemAction(item.id, completed),
      optimisticItems,
    );
  }

  function deleteItem(item: GroceryItem) {
    void mutateItem(
      item,
      () => deleteGroceryItemAction(item.id),
      items.filter((entry) => entry.id !== item.id),
    );
  }

  function clearCompleted() {
    const previousItems = items;
    setError(undefined);
    setItems(openItems);

    startClearing(async () => {
      const result = await clearCompletedGroceriesAction();
      if (result.error) {
        setItems(previousItems);
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="min-w-0 overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]">
                  <ShoppingBasket className="size-[18px]" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Gezamenlijke lijst
                  </h2>
                  <p className="text-xs text-slate-400">
                    {openItems.length === 0
                      ? "Alles is in huis"
                      : `${openItems.length} ${
                          openItems.length === 1 ? "product" : "producten"
                        } te gaan`}
                  </p>
                </div>
              </div>
            </div>
            {total > 0 && (
              <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                {completionPercentage}% afgerond
              </span>
            )}
          </div>

          {total > 0 && (
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {openItems.length ? (
          <div>
            {categoryOrder.map((categoryKey) => {
              const categoryItems = openItems.filter(
                (item) => item.category === categoryKey,
              );
              if (!categoryItems.length) return null;

              return (
                <section
                  key={categoryKey}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between bg-slate-50/60 px-4 py-2.5 sm:px-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      {categoryConfig[categoryKey].label}
                    </p>
                    <span className="text-[11px] font-medium text-slate-400">
                      {categoryItems.length}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {categoryItems.map((item) => (
                      <GroceryRow
                        key={item.id}
                        item={item}
                        onToggle={toggleItem}
                        onDelete={deleteItem}
                        pending={pendingIds.has(item.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center px-6 py-10 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Check className="size-7" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-800">
                De lijst is leeg
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Alles gehaald? Lekker. Voeg rechts een product toe zodra er
                weer iets opraakt.
              </p>
            </div>
          </div>
        )}

        {completedItems.length > 0 && (
          <section className="border-t border-slate-200">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold text-slate-600">
                  Al meegenomen
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {completedItems.length} afgevinkt
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                disabled={clearing}
                className="text-xs text-slate-500"
              >
                <Trash2 className="size-3.5" />
                {clearing ? "Opruimen..." : "Opruimen"}
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {completedItems.map((item) => (
                <GroceryRow
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                  pending={pendingIds.has(item.id)}
                />
              ))}
            </div>
          </section>
        )}
      </Card>

      <aside className="xl:sticky xl:top-8">
        <AddGroceryForm />
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/50 p-4">
          <p className="text-xs font-semibold text-slate-600">
            Slim samen winkelen
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Vink producten af terwijl je winkelt. De rest van het huishouden
            ziet de actuele lijst bij de volgende verversing.
          </p>
        </div>
      </aside>
    </div>
  );
}
