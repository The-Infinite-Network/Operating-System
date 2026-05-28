import type { ReactNode } from "react";

interface SessionWizardProps {
  title: string;
  steps: string[];
  activeStep: number;
  onStepChange: (nextStep: number) => void;
  children: ReactNode;
}

export default function SessionWizard({
  title,
  steps,
  activeStep,
  onStepChange,
  children,
}: SessionWizardProps) {
  return (
    <div className="ops-card">
      <div className="ops-wizard-header">
        <div>
          <div className="ops-eyebrow">Baseline Sprint</div>
          <h2>{title}</h2>
        </div>
        <div className="ops-steps">
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              className={`ops-step ${index === activeStep ? "active" : ""}`}
              onClick={() => onStepChange(index)}
            >
              <span>{index + 1}</span>
              {step}
            </button>
          ))}
        </div>
      </div>
      <div className="ops-wizard-body">{children}</div>
      <div className="ops-wizard-controls">
        <button
          type="button"
          className="ops-btn ops-btn-ghost"
          onClick={() => onStepChange(Math.max(0, activeStep - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="ops-btn ops-btn-secondary"
          onClick={() => onStepChange(Math.min(steps.length - 1, activeStep + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
