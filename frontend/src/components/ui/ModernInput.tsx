/**
 * Modern Input Component with Floating Label & States
 */
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outline";
  inputSize?: "sm" | "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      leftIcon,
      rightIcon,
      fullWidth = false,
      variant = "default",
      inputSize = "md",
      type = "text",
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === "password";
    const hasError = !!error;
    const hasSuccess = !!success;
    const hasValue = !!props.value || !!props.defaultValue;

    const containerClasses = clsx("relative", fullWidth && "w-full");

    const baseInputClasses = clsx(
      "peer w-full transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "placeholder:text-dark-500",
      leftIcon && "pl-11",
      (rightIcon || isPassword) && "pr-11"
    );

    const variantClasses = {
      default: clsx(
        "bg-dark-900/50 backdrop-blur-sm border border-white/10",
        "hover:border-white/20",
        "focus:border-primary-500/50 focus:bg-dark-900/70",
        hasError && "border-error-500/50 focus:border-error-500 focus:ring-error-500",
        hasSuccess && "border-success-500/50 focus:border-success-500 focus:ring-success-500",
        !hasError && !hasSuccess && "focus:ring-primary-500"
      ),
      filled: clsx(
        "bg-dark-800/70 backdrop-blur-sm border-0 border-b-2 border-white/20",
        "hover:bg-dark-800/90",
        "focus:bg-dark-900/70 focus:border-primary-500",
        "rounded-t-xl rounded-b-none",
        hasError && "border-error-500 focus:border-error-500 focus:ring-error-500",
        hasSuccess && "border-success-500 focus:border-success-500 focus:ring-success-500",
        !hasError && !hasSuccess && "focus:ring-primary-500"
      ),
      outline: clsx(
        "bg-transparent border-2 border-white/20",
        "hover:border-white/30",
        "focus:border-primary-500 focus:bg-dark-900/20",
        hasError && "border-error-500 focus:border-error-500 focus:ring-error-500",
        hasSuccess && "border-success-500 focus:border-success-500 focus:ring-success-500",
        !hasError && !hasSuccess && "focus:ring-primary-500"
      ),
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm rounded-lg",
      md: "px-4 py-3 text-sm rounded-xl",
      lg: "px-5 py-4 text-base rounded-xl",
    };

    const labelClasses = clsx(
      "absolute left-4 transition-all duration-200 pointer-events-none",
      "text-dark-400",
      isFocused || hasValue ? "top-1 text-xs" : "top-1/2 -translate-y-1/2 text-sm",
      isFocused && !hasError && !hasSuccess && "text-primary-400",
      hasError && "text-error-400",
      hasSuccess && "text-success-400"
    );

    return (
      <div className={containerClasses}>
        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">{leftIcon}</div>}

          {/* Input field */}
          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            className={clsx(
              baseInputClasses,
              variantClasses[variant],
              sizeClasses[inputSize],
              label && "pt-6 pb-2",
              className
            )}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Floating label */}
          {label && (
            <label className={labelClasses}>
              {label}
              {props.required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}

          {/* Right icon or password toggle */}
          {(rightIcon || isPassword) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-dark-400 hover:text-dark-200 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              ) : (
                <div className="text-dark-400">{rightIcon}</div>
              )}
            </div>
          )}

          {/* Status icon */}
          {(hasError || hasSuccess) && (
            <div
              className={clsx("absolute top-1/2 -translate-y-1/2", isPassword || rightIcon ? "right-12" : "right-3")}
            >
              {hasError && <AlertCircle className="w-5 h-5 text-error-500" />}
              {hasSuccess && <CheckCircle2 className="w-5 h-5 text-success-500" />}
            </div>
          )}
        </div>

        {/* Helper text / Error / Success message */}
        {(helperText || error || success) && (
          <div className="mt-2 flex items-start gap-1.5 text-xs">
            {error && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-error-500 flex-shrink-0 mt-0.5" />
                <span className="text-error-400">{error}</span>
              </>
            )}
            {success && !error && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-success-400">{success}</span>
              </>
            )}
            {helperText && !error && !success && <span className="text-dark-400">{helperText}</span>}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export default Input;
