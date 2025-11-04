/**
 * Progress Bar Component
 */
import { clsx } from "clsx";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantColors = {
  default: "from-primary-500 to-purple-500",
  success: "from-green-500 to-emerald-500",
  warning: "from-yellow-500 to-orange-500",
  danger: "from-red-500 to-rose-500",
};

export function ProgressBar({ value, label, showPercentage = true, variant = "default", className }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-slate-300">{label}</span>}
          {showPercentage && <span className="text-slate-400 font-medium">{percentage}%</span>}
        </div>
      )}
      <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/30">
        <div
          className={clsx(
            "h-full bg-gradient-to-r transition-all duration-300 ease-out",
            "relative overflow-hidden",
            variantColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
