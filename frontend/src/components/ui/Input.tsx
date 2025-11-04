/**
 * Input Component with Liquid Glass Styling
 */
import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className, ...props }, ref) => {
    return (
      <div className={clsx("space-y-2", fullWidth && "w-full")}>
        {label && <label className="label">{label}</label>}
        <input ref={ref} className={clsx("input", error && "input-error", className)} {...props} />
        {error && <p className="error-message">{error}</p>}
        {helperText && !error && <p className="help-text">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
