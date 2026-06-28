import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary text-white shadow-lg shadow-primary/15 hover:bg-primary/95",
  secondary: "bg-white text-primary border border-border hover:bg-card",
  ghost: "text-primary hover:bg-primary/10",
  accent: "bg-accent text-foreground hover:bg-accent/90"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({ className, variant = "primary", children, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "focus-ring inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
