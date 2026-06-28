import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: LucideIcon;
}

export const Input = ({ className, label, error, helpText, icon: Icon, id, ...props }: InputProps) => {
  const inputId = id || props.name;

  return (
    <div className="grid gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted pointer-events-none" />
        )}
        <input
          id={inputId}
          className={cn(
            "focus-ring h-12 rounded-2xl border border-border bg-card px-4 py-3 text-sm transition placeholder:text-muted",
            Icon && "pl-12",
            error && "border-danger bg-danger/5",
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-semibold text-danger">{error}</span>}
      {helpText && !error && <span className="text-xs text-muted">{helpText}</span>}
    </div>
  );
};
