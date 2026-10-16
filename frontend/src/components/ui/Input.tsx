import React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 text-neutral-400 dark:text-neutral-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-8 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors focus-visible:outline-none focus-visible:border-neutral-900 dark:focus-visible:border-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-400/20 disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon ? "pl-8" : "",
              error ? "border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/20" : "",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
