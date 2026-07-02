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
    <div className="grid w-full gap-2">
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
            "focus-ring h-[52px] w-full min-w-0 rounded-[18px] border border-border bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm shadow-primary/5 transition placeholder:text-muted hover:border-primary/30 focus:border-primary focus:bg-white focus:shadow-md focus:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60",
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
