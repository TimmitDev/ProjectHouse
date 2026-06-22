import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  { number: 1, label: "Account aanmaken" },
  { number: 2, label: "Jouw huishouden" },
  { number: 3, label: "Dashboard" },
];

export function OnboardingStepper({
  currentStep,
  monochrome = false,
}: {
  currentStep: number;
  monochrome?: boolean;
}) {
  return (
    <ol className="mx-auto flex w-full max-w-sm items-start" aria-label="Installatie">
      {steps.map((step, index) => {
        const complete = step.number < currentStep;
        const active = step.number === currentStep;
        return (
          <li
            key={step.number}
            className={cn(
              "relative flex flex-1 flex-col items-center",
              index < steps.length - 1 &&
                "after:absolute after:left-[calc(50%+18px)] after:top-3.5 after:h-px after:w-[calc(100%-36px)] after:bg-slate-200",
              complete &&
                index < steps.length - 1 &&
                (monochrome ? "after:bg-black" : "after:bg-[var(--accent)]"),
            )}
          >
            <span
              className={cn(
                "relative z-10 grid size-7 place-items-center rounded-full border text-[11px] font-semibold transition",
                complete || active
                  ? monochrome
                    ? "border-black bg-black text-white"
                    : "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-slate-200 bg-white text-slate-400",
              )}
              aria-current={active ? "step" : undefined}
            >
              {complete ? <Check className="size-4" /> : step.number}
            </span>
            <span
              className={cn(
                "mt-2 text-center text-[10px] font-medium sm:text-[11px]",
                active || complete
                  ? monochrome
                    ? "text-black"
                    : "text-slate-800"
                  : "text-slate-400",
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
