import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";

interface ProgressBarProps {
  currentStep: number;
  steps: {
    id: number;
    name: string;
    description: string;
    icon: React.ElementType;
  }[];
}

const ProgressBar = ({ currentStep, steps }: ProgressBarProps) => {
  return (
    <div className="py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="surface-card rounded-2xl px-3 sm:px-6 py-4">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center gap-2">
              {steps.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                return (
                  <>
                    <li key={`step-${step.id}`} className="flex items-center min-w-0">
                      <div className="relative flex items-center justify-center">
                        <motion.div
                          initial={false}
                          animate={{
                            scale: isCurrent ? 1.06 : 1,
                            backgroundColor: isCompleted
                              ? "rgb(var(--brand-600))"
                              : isCurrent
                                ? "rgb(var(--surface))"
                                : "rgb(var(--brand-100))",
                            borderColor:
                              isCompleted || isCurrent
                                ? "rgb(var(--brand-600))"
                                : "rgb(var(--brand-200))",
                          }}
                          transition={{ duration: 0.25 }}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 flex items-center justify-center"
                        >
                          {isCompleted ? (
                            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          ) : (
                            <step.icon
                              className={`
                                h-4 w-4 sm:h-5 sm:w-5
                                ${isCurrent ? "text-[rgb(var(--brand-700))]" : "text-[rgb(var(--brand-400))]"}
                              `}
                            />
                          )}
                        </motion.div>
                      </div>
                      <div className="min-w-0 ml-2 sm:ml-4">
                        <motion.span
                          initial={false}
                          animate={{
                            color:
                              isCurrent || isCompleted
                                ? "rgb(var(--brand-900))"
                                : "rgb(var(--brand-500))",
                            fontWeight: isCurrent ? 700 : 500,
                          }}
                          className="text-[11px] sm:text-sm block leading-tight"
                        >
                          {step.name}
                        </motion.span>
                        <motion.span
                          initial={false}
                          animate={{
                            color: isCurrent ? "rgb(var(--brand-700))" : "rgb(var(--brand-500))",
                          }}
                          className="hidden sm:block text-xs leading-tight"
                        >
                          {step.description}
                        </motion.span>
                      </div>
                    </li>
                    {index < steps.length - 1 && (
                      <li key={`connector-${step.id}`} className="flex-1" aria-hidden="true">
                        <motion.div
                          initial={{ scaleX: 0, opacity: 0.6 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`h-0.5 mx-2 sm:mx-4 origin-left ${
                            step.id < currentStep
                              ? "bg-[rgb(var(--brand-600))]"
                              : "bg-[rgb(var(--brand-200))]"
                          }`}
                        />
                      </li>
                    )}
                  </>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar; 
