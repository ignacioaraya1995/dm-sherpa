'use client';

import { clsx } from 'clsx';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-glass-border">
          <thead className="bg-glass-surface">
            <tr>
              {columns.map((column, i) => (
                <th
                  key={i}
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border/50">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-glass-surface'
                  )}
                >
                  {columns.map((column, i) => (
                    <td
                      key={i}
                      className={clsx(
                        'px-6 py-4 whitespace-nowrap text-sm text-text-secondary',
                        column.className
                      )}
                    >
                      {typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : (row[column.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
