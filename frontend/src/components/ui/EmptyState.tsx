/**
 * Empty State Component
 * Follows UX Strategy: Illustration + message + CTA for empty data states
 */
import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button, ButtonVariant } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center',
        'py-16 px-4 text-center',
        'animate-fade-in',
        className
      )}
    >
      {/* Icon */}
      <div className="w-20 h-20 mb-6 text-gray-600 flex items-center justify-center">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Common empty state variants
interface CommonEmptyStateProps {
  onAction: () => void;
  actionLabel?: string;
}

export function NoDatasets({ onAction, actionLabel = 'Upload Dataset' }: CommonEmptyStateProps) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-full h-full"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      title="No datasets yet"
      description="Upload your first training dataset to get started with fine-tuning models. Supported formats: CSV, JSON, JSONL, and TXT."
      action={{
        label: actionLabel,
        onClick: onAction,
        variant: 'primary',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ),
      }}
    />
  );
}

export function NoJobs({ onAction, actionLabel = 'Start Training' }: CommonEmptyStateProps) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-full h-full"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      }
      title="No training jobs"
      description="You haven't started any training jobs yet. Upload a dataset and configure training parameters to fine-tune your first model."
      action={{
        label: actionLabel,
        onClick: onAction,
        variant: 'primary',
      }}
    />
  );
}

export function NoModels({ onAction }: CommonEmptyStateProps) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-full h-full"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      }
      title="No completed models"
      description="Once your training jobs are completed, your fine-tuned models will appear here. You can then test and download them."
      action={{
        label: 'View Training Jobs',
        onClick: onAction,
        variant: 'secondary',
      }}
    />
  );
}

export function NoSearchResults({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-full h-full"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
      action={onClear ? {
        label: 'Clear Filters',
        onClick: onClear,
        variant: 'secondary',
      } : undefined}
    />
  );
}
