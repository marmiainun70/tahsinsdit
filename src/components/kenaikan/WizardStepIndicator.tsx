import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "@/types/academicTransition";

interface WizardStepIndicatorProps {
  currentStep: number; // 1-indexed
}

const WizardStepIndicator = ({ currentStep }: WizardStepIndicatorProps) => {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <li key={step.label} className="relative flex-1 flex flex-col items-center">
              {/* Connector line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 w-full h-0.5 transition-colors duration-300",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step circle */}
              <div className="relative z-10 flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                    isUpcoming &&
                      "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </span>

                {/* Step label */}
                <div className="mt-2 text-center hidden sm:block">
                  <p
                    className={cn(
                      "text-xs font-semibold transition-colors duration-200",
                      isCurrent ? "text-primary" : isCompleted ? "text-primary/80" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[80px] leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default WizardStepIndicator;
