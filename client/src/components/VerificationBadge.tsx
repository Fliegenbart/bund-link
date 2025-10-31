import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  agency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerificationBadge({ agency, size = "md", className }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md bg-success/10 px-2.5 py-1 font-medium text-success",
        sizeClasses[size],
        className
      )}
      data-testid="badge-verification"
    >
      <ShieldCheck className={iconSizes[size]} />
      <span>Verifiziert{agency ? ` - ${agency}` : ""}</span>
    </div>
  );
}
