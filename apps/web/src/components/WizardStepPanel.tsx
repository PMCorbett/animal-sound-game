import type { ReactNode } from "react";

interface WizardStepPanelProps {
  stepKey: string;
  children: ReactNode;
}

export function WizardStepPanel({ stepKey, children }: WizardStepPanelProps) {
  return (
    <div key={stepKey} className="wizard-step-panel wizard-step-enter">
      {children}
    </div>
  );
}
