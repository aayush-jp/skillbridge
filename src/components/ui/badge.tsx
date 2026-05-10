import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "green" | "orange" | "muted";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:   "bg-blue-50 text-blue",
  green:  "bg-green-50 text-green",
  orange: "bg-orange-50 text-orange",
  muted:  "bg-line text-muted",
};

function Badge({ variant = "muted", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };
