import * as React from "react";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <button 
        disabled={currentPage <= 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <button 
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon, action }: { title: string, description: string, icon?: React.ElementType, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-2xl bg-surface-2/50">
      {Icon && <Icon className="w-12 h-12 mb-4 text-text-muted" />}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-text-muted mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} {...props} />;
}

export function ProgressBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div className="h-full bg-accent transition-all duration-300" style={{ width: `${percentage}%` }} />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-5 w-5", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
