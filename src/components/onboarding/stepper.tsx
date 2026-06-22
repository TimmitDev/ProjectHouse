import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  { number: 1, label: "Create account" },
  { number: 2, label: "Your household" },
  { number: 3, label: "Dashboard" },
];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mx-auto flex w-full max-w-xl items-start" aria-label="Setup">
      {steps.map((step, index) => {
        const complete = step.number < currentStep;
        const active = step.number === currentStep;
        return (
          <li
            key={step.number}
            className={cn(
              "relative flex flex-1 flex-col items-center",
              index < steps.length - 1 &&
                "after:absolute after:left-[calc(50%+20px)] after:top-4 after:h-px after:w-[calc(100%-40px)] after:bg-slate-200",
              complete &&
                index < steps.length - 1 &&
                "after:bg-[var(--accent)]",
            )}
          >
            <span
              className={cn(
                "relative z-10 grid size-8 place-items-center rounded-full border text-xs font-semibold transition",
                complete || active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-slate-200 bg-white text-slate-400",
              )}
              aria-current={active ? "step" : undefined}
            >
              {complete ? <Check className="size-4" /> : step.number}
            </span>
            <span
              className={cn(
                "mt-2 text-center text-[11px] font-medium sm:text-xs",
                active || complete ? "text-slate-800" : "text-slate-400",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
