import Link from "next/link";
import { cn } from "@/lib/utils";
import { memo, forwardRef } from "react";

const variants = {
  primary: "bg-primary text-white shadow-lg shadow-primary/15 hover:bg-[#183f28] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70",
  secondary: "border border-border bg-white text-primary hover:border-primary/25 hover:bg-card active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70",
  ghost: "text-primary hover:bg-primary/10",
  accent: "bg-accent text-foreground shadow-lg shadow-accent/15 hover:bg-[#e1b66f]"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex h-[52px] items-center justify-center rounded-full px-6 text-sm font-extrabold transition",
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
      "focus-ring inline-flex h-[52px] items-center justify-center rounded-full px-6 text-sm font-extrabold transition",
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
