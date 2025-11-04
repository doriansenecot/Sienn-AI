/**
 * Skeleton Loader Component
 * Follows UX Strategy: Animated gradient shimmer for loading states
 */
import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "title" | "avatar" | "button" | "card" | "rect";
  width?: string;
  height?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  animate?: boolean;
}

const roundedClasses = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export function Skeleton({ className, variant = "text", width, height, rounded, animate = true }: SkeletonProps) {
  // Default sizes based on variant
  const defaultConfig = {
    text: { width: "100%", height: "1rem", rounded: "sm" as const },
    title: { width: "100%", height: "1.5rem", rounded: "sm" as const },
    avatar: { width: "2.5rem", height: "2.5rem", rounded: "full" as const },
    button: { width: "100%", height: "2.5rem", rounded: "lg" as const },
    card: { width: "100%", height: "12rem", rounded: "lg" as const },
    rect: { width: "100%", height: "8rem", rounded: "md" as const },
  };

  const config = defaultConfig[variant];
  const finalRounded = rounded || config.rounded;

  return (
    <div
      className={clsx("bg-gray-700", animate && "animate-pulse", roundedClasses[finalRounded], className)}
      style={{
        width: width || config.width,
        height: height || config.height,
      }}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Convenience components for common patterns
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? "80%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl shadow-lg p-6 space-y-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="button" width="6rem" />
        <Skeleton variant="button" width="6rem" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={clsx("space-y-3", className)}>
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-700">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="text" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 py-2">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}
