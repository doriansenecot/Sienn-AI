/**
 * Modern Progress Bar with Animations & Variants
 */
import { forwardRef, HTMLAttributes } from "react";
import { clsx } from "clsx";

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  label?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  animated?: boolean;
  striped?: boolean;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      variant = "default",
      size = "md",
      label,
      showPercentage = false,
      showValue = false,
      animated = true,
      striped = false,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const isComplete = percentage >= 100;

    const containerClasses = clsx("w-full", className);

    const trackClasses = clsx(
      "relative w-full overflow-hidden rounded-full",
      "bg-dark-800/50 backdrop-blur-sm",
      size === "sm" && "h-1.5",
      size === "md" && "h-3",
      size === "lg" && "h-4"
    );

    const fillBaseClasses = clsx(
      "h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden",
      animated && "animate-pulse-slow",
      isComplete && "animate-bounce-in"
    );

    const variantClasses = {
      default: "bg-gradient-to-r from-primary-600 to-primary-500 shadow-glow-sm",
      success: "bg-gradient-to-r from-success-600 to-success-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]",
      warning: "bg-gradient-to-r from-warning-600 to-warning-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
      danger: "bg-gradient-to-r from-error-600 to-error-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
      gradient: "bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 shadow-glow-sm",
    };

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {/* Label or percentage */}
        {(label || showPercentage || showValue) && (
          <div className="flex items-center justify-between mb-2 text-sm">
            {label && <span className="text-dark-300 font-medium">{label}</span>}
            {showPercentage && (
              <span className={clsx("font-semibold tabular-nums", isComplete ? "text-success-400" : "text-dark-400")}>
                {percentage.toFixed(0)}%
              </span>
            )}
            {showValue && !showPercentage && (
              <span className="text-dark-400 tabular-nums">
                {value} / {max}
              </span>
            )}
          </div>
        )}

        {/* Progress track */}
        <div className={trackClasses}>
          {/* Fill */}
          <div className={clsx(fillBaseClasses, variantClasses[variant])} style={{ width: `${percentage}%` }}>
            {/* Striped pattern */}
            {striped && (
              <div
                className="absolute inset-0 animate-shimmer"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)",
                  backgroundSize: "1rem 1rem",
                }}
              />
            )}

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>

          {/* Glow effect for complete */}
          {isComplete && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          )}
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
export default ProgressBar;
