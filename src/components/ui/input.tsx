import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input">;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-full border border-border-subtle bg-canvas px-5",
        "text-sm text-primary placeholder:text-secondary",
        "transition-colors duration-200",
        "focus:border-accent-hover focus:outline-none focus:ring-1 focus:ring-accent-hover",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
