import Link from "next/link";
import { cn } from "@/lib/utils";
import { memo, forwardRef } from "react";

const variants = {
  primary: "bg-primary text-white shadow-lg shadow-primary/15 hover:bg-primary/95",
  secondary: "bg-white text-primary border border-border hover:bg-card",
  ghost: "text-primary hover:bg-primary/10",
  accent: "bg-accent text-foreground hover:bg-accent/90"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);

ButtonComponent.displayName = "Button";

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
};

const ButtonLinkComponent = ({ className, variant = "primary", children, ...props }: ButtonLinkProps) => (
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

export const Button = memo(ButtonComponent);
export const ButtonLink = memo(ButtonLinkComponent);
