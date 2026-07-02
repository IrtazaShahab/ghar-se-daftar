import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LogoIcon({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11"
  };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeMap[size], className)}
    >
      <path d="M18 28c0-7.2 6-13 14-13s14 5.8 14 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M17 28h30l-2.8 22.5a5 5 0 0 1-5 4.4H24.8a5 5 0 0 1-5-4.4L17 28Z" fill="currentColor" opacity="0.16" />
      <path d="M17 28h30l-2.8 22.5a5 5 0 0 1-5 4.4H24.8a5 5 0 0 1-5-4.4L17 28Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M23 38h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 10c5 1.2 8.3 4.9 9.7 10.7-5.3.3-9.8-2.5-11.2-7.1-.4-1.4.2-2.8 1.5-3.6Z" fill="currentColor" opacity="0.32" />
      <path d="M31 12c1.7 2.7 4.2 4.7 7.4 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function LogoFull({ className, size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? "w-10 h-10" : size === "md" ? "w-12 h-12" : "w-14 h-14";
  const textSize = size === "sm" ? "text-base" : size === "md" ? "text-lg" : "text-xl";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(iconSize, "grid place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/15 transition group-hover:rotate-[-4deg]")}>
        <LogoIcon size={size} className="text-white" />
      </div>
      <div>
        <div className={cn(textSize, "font-bold leading-none tracking-[-0.01em] text-foreground")}>
          Ghar Se Daftar
        </div>
        <div className="mt-1 text-[11px] font-semibold text-muted">Ghar Ka Khana, Ab Daftar Tak</div>
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
    <div className={cn(sizeMap[size], "grid place-items-center rounded-full bg-primary text-white")}>
      <LogoIcon size={size} className="text-white" />
    </div>
  );
}
