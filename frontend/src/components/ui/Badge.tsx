/**
 * Badge Component for Status Indicators
 * Follows UX Strategy: Never color-only info, always icon + color + text
 */
import { ReactNode } from "react";
import { clsx } from "clsx";
import { CheckCircle, XCircle, AlertTriangle, Info, Clock, Zap } from "lucide-react";

export type BadgeVariant = "success" | "error" | "warning" | "info" | "primary" | "secondary" | "neutral";
export type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  showIcon?: boolean;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success/20 text-success border-success/50",
  error: "bg-error/20 text-error border-error/50",
  warning: "bg-warning/20 text-warning border-warning/50",
  info: "bg-info/20 text-info border-info/50",
  primary: "bg-primary-600/20 text-primary-400 border-primary-500/50",
  secondary: "bg-secondary-600/20 text-secondary-400 border-secondary-500/50",
  neutral: "bg-gray-700/50 text-gray-300 border-gray-600/50",
};

const sizeClasses: Record<BadgeSize, { container: string; icon: string; dot: string }> = {
  sm: {
    container: "px-2 py-0.5 text-xs",
    icon: "w-3 h-3",
    dot: "w-1.5 h-1.5",
  },
  md: {
    container: "px-2.5 py-1 text-sm",
    icon: "w-4 h-4",
    dot: "w-2 h-2",
  },
};

const defaultIcons: Record<BadgeVariant, ReactNode> = {
  success: <CheckCircle />,
  error: <XCircle />,
  warning: <AlertTriangle />,
  info: <Info />,
  primary: <Zap />,
  secondary: <Zap />,
  neutral: <Clock />,
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  icon,
  showIcon = false,
  dot = false,
  className,
}: BadgeProps) {
  const IconComponent = icon || (showIcon ? defaultIcons[variant] : null);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        "transition-all duration-fast",
        variantClasses[variant],
        sizeClasses[size].container,
        className
      )}
      role="status"
    >
      {dot && (
        <span
          className={clsx(
            "rounded-full",
            sizeClasses[size].dot,
            variant === "success" && "bg-success",
            variant === "error" && "bg-error",
            variant === "warning" && "bg-warning",
            variant === "info" && "bg-info",
            variant === "primary" && "bg-primary-400",
            variant === "secondary" && "bg-secondary-400",
            variant === "neutral" && "bg-gray-400"
          )}
        />
      )}
      {IconComponent && <span className={sizeClasses[size].icon}>{IconComponent}</span>}
      {children}
    </span>
  );
}

// Status-specific badge variants for common use cases
interface StatusBadgeProps {
  status: "pending" | "running" | "completed" | "failed";
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const statusConfig = {
    pending: { variant: "warning" as BadgeVariant, label: "Pending", dot: true, showIcon: false },
    running: { variant: "info" as BadgeVariant, label: "Running", dot: true, showIcon: false },
    completed: { variant: "success" as BadgeVariant, label: "Completed", showIcon: true, dot: false },
    failed: { variant: "error" as BadgeVariant, label: "Failed", showIcon: true, dot: false },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} showIcon={config.showIcon} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  );
}
