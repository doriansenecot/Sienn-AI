/**
 * Alert Component for Contextual Messages
 * Follows UX Strategy: Clear messages with icons, dismissable
 */
import { ReactNode, useState } from 'react';
import { clsx } from 'clsx';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  X 
} from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: ReactNode;
  className?: string;
}

const variantConfig = {
  success: {
    container: 'bg-success/10 border-success/50 text-success',
    icon: CheckCircle,
    iconColor: 'text-success',
  },
  error: {
    container: 'bg-error/10 border-error/50 text-error',
    icon: XCircle,
    iconColor: 'text-error',
  },
  warning: {
    container: 'bg-warning/10 border-warning/50 text-warning',
    icon: AlertTriangle,
    iconColor: 'text-warning',
  },
  info: {
    container: 'bg-info/10 border-info/50 text-info',
    icon: Info,
    iconColor: 'text-info',
  },
};

export function Alert({
  variant,
  title,
  children,
  dismissible = false,
  onDismiss,
  actions,
  className,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className={clsx(
        'relative flex items-start gap-3 p-4 rounded-lg border',
        'animate-fade-in',
        config.container,
        className
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5">
        <IconComponent className={clsx('w-5 h-5', config.iconColor)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">
            {title}
          </h4>
        )}
        <div className="text-sm opacity-90">
          {children}
        </div>
        {actions && (
          <div className="mt-3 flex gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Convenience components for common patterns
interface SimpleAlertProps {
  variant: AlertVariant;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function SimpleAlert({ variant, message, dismissible, onDismiss }: SimpleAlertProps) {
  return (
    <Alert variant={variant} dismissible={dismissible} onDismiss={onDismiss}>
      {message}
    </Alert>
  );
}
