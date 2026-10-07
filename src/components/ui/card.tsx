import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card component with soft inner glow on hover.
 */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-surface text-text shadow-sm transition-all hover:shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
