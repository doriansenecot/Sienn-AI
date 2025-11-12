/**
 * Modern Card Component with Glass Morphism & Hover Effects
 */
import { ReactNode, forwardRef, HTMLAttributes } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "glass" | "glass-strong" | "frosted" | "gradient";
  hoverable?: boolean;
  glow?: boolean;
  shimmer?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      hoverable = false,
      glow = false,
      shimmer = false,
      padding = "lg",
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses = clsx(
      "relative rounded-2xl transition-all duration-300",
      hoverable && "cursor-pointer hover-lift",
      glow && "card-glow",
      shimmer && "shimmer"
    );

    const variantClasses = {
      default: "bg-dark-900/50 backdrop-blur-md border border-white/10",
      glass: "glass",
      "glass-strong": "glass-strong",
      frosted: "bg-dark-900/80 backdrop-blur-2xl border border-white/5",
      gradient:
        "bg-gradient-to-br from-dark-900/90 via-dark-800/90 to-dark-900/90 backdrop-blur-xl border border-white/10",
    };

    const paddingClasses = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    };

    return (
      <div
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], paddingClasses[padding], className)}
        {...props}
      >
        {children}

        {/* Shimmer effect */}
        {shimmer && (
          <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Sub-components
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx("mb-6", className)} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  gradient?: boolean;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, gradient = false, className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={clsx("text-2xl font-bold", gradient ? "text-gradient" : "text-white", className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p ref={ref} className={clsx("text-sm text-dark-400 mt-2", className)} {...props}>
        {children}
      </p>
    );
  }
);

CardDescription.displayName = "CardDescription";

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx("space-y-4", className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={clsx("mt-6 flex items-center gap-3", className)} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
