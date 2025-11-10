/**
 * Card Component
 */
import { ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "medium" | "frosted";
  onClick?: () => void;
  hoverable?: boolean;
}

const variantClasses = {
  default: "card",
  medium: "card bg-slate-800/70 backdrop-blur-lg",
  frosted: "bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-lg",
};

export function Card({ children, className, variant = "default", onClick, hoverable = false }: CardProps) {
  return (
    <div
      className={clsx(
        "card-body",
        variantClasses[variant],
        hoverable && "card-hover cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={clsx("card-header", className)}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={clsx("text-2xl font-bold text-white", className)}>{children}</h3>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={clsx("space-y-4", className)}>{children}</div>;
}
