/**
 * Table Component with Responsive Card View on Mobile
 * Follows UX Strategy: Sticky header, sortable columns, hover states
 */
import { ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  emptyMessage?: string;
  className?: string;
  responsive?: boolean;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = "No data available",
  className,
  responsive = true,
}: TableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key as string);
    }
  };

  if (data.length === 0) {
    return <div className="text-center py-12 text-slate-400">{emptyMessage}</div>;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div
        className={clsx(
          "overflow-x-auto rounded-lg border border-gray-700",
          responsive && "hidden md:block",
          !responsive && "block",
          className
        )}
      >
        <table className="w-full text-sm text-left">
          {/* Header */}
          <thead className="text-xs uppercase tracking-wider bg-slate-800/70 backdrop-blur-lg text-gray-300 border-b border-gray-700 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={clsx(
                    "px-6 py-3 font-semibold",
                    column.sortable && "cursor-pointer select-none hover:bg-gray-700/50 transition-colors",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span>
                        {sortDirection === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-700">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={clsx("hover:bg-glass-light transition-colors", onRowClick && "cursor-pointer")}
              >
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className={clsx(
                      "px-6 py-4 text-gray-300",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.render ? column.render(item) : String(item[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {responsive && (
        <div className="md:hidden space-y-4">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={clsx(
                "bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl shadow-lg p-4 space-y-3",
                onRowClick && "cursor-pointer hover:bg-slate-800/70 transition-colors"
              )}
            >
              {columns.map((column) => (
                <div key={column.key as string} className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-gray-400 min-w-0 flex-shrink-0">{column.header}:</span>
                  <span className="text-sm text-white text-right">
                    {column.render ? column.render(item) : String(item[column.key] ?? "-")}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
