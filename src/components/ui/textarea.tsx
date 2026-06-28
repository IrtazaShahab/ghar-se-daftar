import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = ({ className, label, error, helpText, id, ...props }: TextareaProps) => {
  const inputId = id || props.name;

  return (
    <div className="grid gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "focus-ring rounded-2xl border border-border bg-card px-4 py-3 text-sm transition placeholder:text-muted resize-none",
          error && "border-danger bg-danger/5",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs font-semibold text-danger">{error}</span>}
      {helpText && !error && <span className="text-xs text-muted">{helpText}</span>}
    </div>
  );
};
