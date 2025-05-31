import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-colors",
        {
          "bg-blue-600 hover:bg-blue-700": variant === "primary",
          "bg-gray-800 hover:bg-gray-700": variant === "secondary",
          "border border-gray-600 hover:bg-gray-800": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
} 