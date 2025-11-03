/**
 * Select Dropdown Component
 * Follows UX Strategy: Custom styling, keyboard accessible
 */
import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      fullWidth = false,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('space-y-2', fullWidth && 'w-full')}>
        {label && <label className="label">{label}</label>}

        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Select */}
          <select
            ref={ref}
            className={clsx(
              'w-full px-4 py-2.5 rounded-lg appearance-none',
              'bg-slate-800/50 border border-slate-700/50',
              'text-white placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
              'transition-all duration-200',
              'cursor-pointer',
              icon && 'pl-10',
              'pr-10', // Space for chevron
              error && 'border-error focus:ring-error',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
        {helperText && !error && <p className="help-text">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Grouped Select Variant
interface GroupedSelectOption {
  label: string;
  options: SelectOption[];
}

interface GroupedSelectProps extends Omit<SelectProps, 'options'> {
  groups: GroupedSelectOption[];
}

export const GroupedSelect = forwardRef<HTMLSelectElement, GroupedSelectProps>(
  ({ groups, label, error, helperText, placeholder, fullWidth, icon, className, ...props }, ref) => {
    return (
      <div className={clsx('space-y-2', fullWidth && 'w-full')}>
        {label && <label className="label">{label}</label>}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          <select
            ref={ref}
            className={clsx(
              'w-full px-4 py-2.5 rounded-lg appearance-none',
              'bg-slate-800/50 border border-slate-700/50',
              'text-white placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
              'transition-all duration-200',
              'cursor-pointer',
              icon && 'pl-10',
              'pr-10',
              error && 'border-error focus:ring-error',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
        {helperText && !error && <p className="help-text">{helperText}</p>}
      </div>
    );
  }
);

GroupedSelect.displayName = 'GroupedSelect';
