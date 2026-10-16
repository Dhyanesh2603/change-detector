import React from "react";
import { cn } from "../../utils/cn";
import { HealthStatus } from "../../types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: HealthStatus | string;
  variant?: "default" | "success" | "warning" | "danger" | "neutral" | "info";
  size?: "xs" | "sm";
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  status,
  variant,
  size = "xs",
  showDot = true,
  children,
  ...props
}) => {
  // Determine variant based on HealthStatus string if passed
  let resolvedVariant = variant || "neutral";
  let label = children;

  if (status) {
    const s = status.toUpperCase();
    if (s === "HEALTHY") {
      resolvedVariant = "success";
      label = label || "Healthy";
    } else if (s === "CHANGED") {
      resolvedVariant = "warning";
      label = label || "Changed";
    } else if (s === "FAILED") {
      resolvedVariant = "danger";
      label = label || "Failed";
    } else if (s === "CHECKING") {
      resolvedVariant = "info";
      label = label || "Checking";
    } else {
      resolvedVariant = "neutral";
      label = label || "Pending";
    }
  }

  const variantStyles = {
    success: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    warning: "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    danger: "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
    info: "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700",
    neutral: "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800",
    default: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
  };

  const dotStyles = {
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-rose-500 dark:bg-rose-400",
    info: "bg-neutral-500 dark:bg-neutral-400",
    neutral: "bg-neutral-400 dark:bg-neutral-500",
    default: "bg-neutral-500",
  };

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[11px] gap-1.5",
    sm: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border select-none tracking-tight",
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyles[resolvedVariant])} />
      )}
      <span>{label}</span>
    </span>
  );
};
