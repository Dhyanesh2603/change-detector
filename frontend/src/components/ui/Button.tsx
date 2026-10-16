import React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "sm", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer rounded";

    const variantStyles = {
      primary:
        "bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900 dark:border-neutral-200 shadow-sm",
      secondary:
        "bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-800 shadow-none",
      outline:
        "bg-transparent hover:bg-neutral-100 text-neutral-700 border border-neutral-300 dark:hover:bg-neutral-800/80 dark:text-neutral-300 dark:border-neutral-700",
      danger:
        "bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-300 dark:border-rose-900/60",
      ghost:
        "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 border-transparent",
    };

    const sizeStyles = {
      xs: "h-6 px-2 text-xs gap-1",
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-3.5 text-sm gap-2",
      lg: "h-10 px-4 text-sm gap-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
