import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-gray-900/50 backdrop-blur-sm rounded-lg shadow-lg",
        className
      )}
      {...props}
    />
  );
} 