import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = ({ className, label, error, helpText, id, ...props }: TextareaProps) => {
  const inputId = id || props.name;

  return (
    <div className="grid w-full gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "focus-ring min-h-28 w-full min-w-0 resize-none rounded-[18px] border border-border bg-white/85 px-4 py-3 text-sm text-foreground shadow-sm shadow-primary/5 transition placeholder:text-muted hover:border-primary/30 focus:border-primary focus:bg-white focus:shadow-md focus:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60",
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
