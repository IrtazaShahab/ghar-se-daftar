import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyPKR(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
  }).format(value);
}

export function whatsappUrl(message: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923704756269";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
