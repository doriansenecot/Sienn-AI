/**
 * Modern Button Component with Advanced States & Micro-animations
 */
import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'accent'
  | 'outline' 
  | 'ghost' 
  | 'danger'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  shimmer?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      shimmer = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = clsx(
      'relative inline-flex items-center justify-center gap-2',
      'font-semibold transition-all duration-200 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none overflow-hidden',
      fullWidth && 'w-full'
    );

    const variantClasses = {
      primary: clsx(
        'bg-gradient-to-r from-primary-600 to-primary-500 text-white',
        'hover:from-primary-500 hover:to-primary-400',
        'active:scale-[0.98]',
        'shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40',
        'focus:ring-primary-500'
      ),
      secondary: clsx(
        'bg-gradient-to-r from-secondary-600 to-secondary-500 text-white',
        'hover:from-secondary-500 hover:to-secondary-400',
        'active:scale-[0.98]',
        'shadow-lg shadow-secondary-500/30 hover:shadow-xl hover:shadow-secondary-500/40',
        'focus:ring-secondary-500'
      ),
      accent: clsx(
        'bg-gradient-to-r from-accent-600 to-accent-500 text-white',
        'hover:from-accent-500 hover:to-accent-400',
        'active:scale-[0.98]',
        'shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40',
        'focus:ring-accent-500'
      ),
      outline: clsx(
        'bg-transparent text-primary-400 border-2 border-primary-500/50',
        'hover:bg-primary-500/10 hover:border-primary-500 hover:text-primary-300',
        'active:scale-[0.98]',
        'focus:ring-primary-500'
      ),
      ghost: clsx(
        'bg-white/5 text-dark-200 backdrop-blur-sm border border-white/10',
        'hover:bg-white/10 hover:text-white hover:border-white/20',
        'active:scale-[0.98]',
        'focus:ring-dark-500'
      ),
      danger: clsx(
        'bg-gradient-to-r from-error-600 to-error-500 text-white',
        'hover:from-error-500 hover:to-error-400',
        'active:scale-[0.98]',
        'shadow-lg shadow-error-500/30 hover:shadow-xl hover:shadow-error-500/40',
        'focus:ring-error-500'
      ),
      success: clsx(
        'bg-gradient-to-r from-success-600 to-success-500 text-white',
        'hover:from-success-500 hover:to-success-400',
        'active:scale-[0.98]',
        'shadow-lg shadow-success-500/30 hover:shadow-xl hover:shadow-success-500/40',
        'focus:ring-success-500'
      ),
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-xs rounded-lg',
      md: 'px-6 py-3 text-sm rounded-xl',
      lg: 'px-8 py-4 text-base rounded-2xl',
      icon: 'p-3 rounded-xl',
    };

    const showIcon = !loading && icon;
    const content = (
      <>
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {showIcon && iconPosition === 'left' && icon}
        {children && <span>{children}</span>}
        {showIcon && iconPosition === 'right' && icon}
      </>
    );

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          shimmer && 'shimmer',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {content}
        
        {/* Shimmer overlay */}
        {shimmer && !loading && (
          <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
