import { type ClassValue, clsx } from "clsx";

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Uses clsx for conditional class merging
 *
 * @example
 * cn('text-red-500', condition && 'text-blue-500')
 * cn('px-4 py-2', { 'bg-red-500': isError, 'bg-green-500': isSuccess })
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
