import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DataTableColumn {
  key: string
  label: string
  className?: string
}

interface DataTableProps {
  columns: DataTableColumn[]
  children: ReactNode
  className?: string
  tableClassName?: string
}

const defaultHeaderClassName =
  'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)] whitespace-nowrap'

export function DataTable({
  columns,
  children,
  className,
  tableClassName,
}: DataTableProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className={cn('w-full text-sm', tableClassName)}>
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(defaultHeaderClassName, column.className)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}
