import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  asChild?: boolean;
}

/**
 * Standard button component.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, asChild = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const variants = {
      primary: "bg-accent text-white hover:bg-accent/90 shadow-sm",
      secondary: "bg-surface-2 text-text hover:bg-surface-2/80",
      ghost: "hover:bg-surface-2 text-text",
      danger: "bg-danger text-white hover:bg-danger/90 shadow-sm",
    };
    
    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-lg",
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {asChild
          ? loading
            ? <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{children}</div>
            : children
          : <>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {children}
            </>}
      </Comp>
    );
  }
);
Button.displayName = "Button";
