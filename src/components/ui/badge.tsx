import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

/**
 * Small pill badge.
 */
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-2 text-text",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    outline: "border border-border text-text",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/**
 * Domain-specific badge for registration states.
 */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    confirmed: { label: "Confirmed", variant: "success" },
    waitlisted: { label: "Waitlisted", variant: "warning" },
    cancelled: { label: "Cancelled", variant: "outline" },
    rejected: { label: "Rejected", variant: "danger" },
    checked_in: { label: "Checked In", variant: "default" },
  };

  const config = map[status] || { label: status, variant: "default" };
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
