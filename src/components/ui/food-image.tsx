"use client";

import Image from "next/image";
import { useState } from "react";

export interface FoodImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
}

/**
 * Wrapper around Next.js Image that handles missing food images gracefully.
 * If the image fails to load or is not provided, displays a fallback gradient.
 * Must be a client component to use onError handler.
 */
export function FoodImage({ src, alt, className = "" }: FoodImageProps) {
  const [imageError, setImageError] = useState(false);

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={`w-full h-full bg-[radial-gradient(circle_at_30%_30%,#d4a373_0%_20%,#f8f4ec_21%_35%,#8b5a2b_36%_40%,#355e3b_41%_45%,#fffaf2_46%)] ${className}`}
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
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      loading="lazy"
      quality={75}
      onError={() => setImageError(true)}
    />
  );
}
