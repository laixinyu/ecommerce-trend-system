'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobileLabel?: string; // Optional different label for mobile
  hideOnMobile?: boolean;
}

interface MobileTableProps {
  data: any[];
  columns: Column[];
  keyField: string;
  emptyMessage?: string;
  className?: string;
}

export function MobileTable({
  data,
  columns,
  keyField,
  emptyMessage = '暂无数据',
  className,
}: MobileTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Desktop view
  const DesktopTable = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left p-4 font-medium text-sm text-muted-foreground"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]} className="border-b hover:bg-muted/50">
              {columns.map((column) => (
                <td key={column.key} className="p-4 text-sm">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile view - card-based
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {data.map((row) => {
        const isExpanded = expandedRows.has(row[keyField]);
        const visibleColumns = columns.filter((col) => !col.hideOnMobile);
        const primaryColumn = visibleColumns[0];
        const secondaryColumns = visibleColumns.slice(1);

        return (
          <Card key={row[keyField]} className="overflow-hidden">
            <CardHeader
              className="p-4 cursor-pointer"
              onClick={() => toggleRow(row[keyField])}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {primaryColumn.render
                      ? primaryColumn.render(row[primaryColumn.key], row)
                      : row[primaryColumn.key]}
                  </CardTitle>
                  {secondaryColumns.length > 0 && !isExpanded && (
                    <div className="text-sm text-muted-foreground mt-1 truncate">
                      {secondaryColumns[0].render
                        ? secondaryColumns[0].render(
                            row[secondaryColumns[0].key],
                            row
                          )
                        : row[secondaryColumns[0].key]}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="ml-2 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-4 pt-0 space-y-3 border-t">
                {secondaryColumns.map((column) => (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">
                      {column.mobileLabel || column.label}:
                    </span>
                    <span className="text-sm font-medium text-right ml-4">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </span>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className={className}>
      <DesktopTable />
      <MobileCards />
    </div>
  );
}

// Horizontal scroll table for mobile
interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableTable({ children, className }: ScrollableTableProps) {
  return (
    <div className={cn('overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0', className)}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border rounded-lg md:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
