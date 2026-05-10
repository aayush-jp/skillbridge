import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("bg-paper border border-line shadow-sm rounded-xl", className)}
      {...props}
    />
  );
}

export { Card };
export type { CardProps };
