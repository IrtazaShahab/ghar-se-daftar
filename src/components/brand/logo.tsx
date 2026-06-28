import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LogoIcon({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14"
  };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
    >
      {/* Home roof */}
      <path d="M 10 40 L 32 12 L 54 40" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Home walls */}
      <rect x="14" y="40" width="36" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Home door */}
      <rect x="28" y="44" width="8" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Tiffin/Daig on top - circular lid */}
      <circle cx="32" cy="26" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Tiffin handle */}
      <path d="M 25 26 Q 32 16 39 26" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoFull({ className, size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? "w-9 h-9" : size === "md" ? "w-11 h-11" : "w-14 h-14";
  const textSize = size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(iconSize, "grid place-items-center rounded-2xl bg-primary text-white")}>
        <LogoIcon size={size} className="text-white" />
      </div>
      <div>
        <div className={cn(textSize, "font-serif font-semibold leading-none text-foreground")}>
          Ghar Se Daftar
        </div>
        <div className="mt-1 text-xs font-medium text-muted">Ghar Ka Khana, Ab Daftar Tak</div>
      </div>
    </div>
  );
}

export function LogoMark({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn(sizeMap[size], "grid place-items-center rounded-xl bg-primary text-white")}>
      <LogoIcon size={size} className="text-white" />
    </div>
  );
}
