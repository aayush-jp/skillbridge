"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full h-11 px-3",
        "border border-line rounded-lg",
        "bg-paper text-ink text-sm",
        "placeholder:text-muted",
        "transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
