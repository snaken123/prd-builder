import type { ReactNode } from "react";
import { InfoIcon } from "./InfoIcon";

interface FieldProps {
  label: string;
  explanation: string;
  example?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, explanation, example, required, children }: FieldProps) {
  return (
    <div className="field">
      <div className="field-label">
        <label>
          {label}
          {required && <span className="required">*</span>}
        </label>
        <InfoIcon explanation={explanation} example={example} />
      </div>
      {children}
    </div>
  );
}
