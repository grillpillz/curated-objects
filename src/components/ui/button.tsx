import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-primary text-canvas hover:bg-primary/90",
  secondary:
    "bg-border-subtle text-primary hover:bg-accent",
  outline:
    "border border-border-subtle bg-transparent text-primary hover:bg-border-subtle",
  ghost:
    "bg-transparent text-primary hover:bg-border-subtle",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
  icon: "h-10 w-10",
} as const;

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
};

export function Button({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium lowercase",
        "transition-all duration-200 ease-in-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
