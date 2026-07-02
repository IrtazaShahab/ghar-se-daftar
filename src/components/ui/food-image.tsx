"use client";

import Image from "next/image";
import { useState } from "react";

export interface FoodImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Wrapper around Next.js Image that handles missing food images gracefully.
 * If the image fails to load or is not provided, displays a fallback gradient.
 * Must be a client component to use onError handler.
 */
export function FoodImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false
}: FoodImageProps) {
  const [imageError, setImageError] = useState(false);

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={`w-full h-full bg-[radial-gradient(circle_at_30%_30%,#d9a85f_0%_20%,#fffaf1_21%_35%,#966331_36%_40%,#214f32_41%_45%,#f6f0e4_46%)] ${className}`}
        aria-label={`${alt} - placeholder`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      quality={75}
      onError={() => setImageError(true)}
    />
  );
}
