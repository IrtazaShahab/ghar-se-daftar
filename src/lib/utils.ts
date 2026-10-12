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

/**
 * wa.me wants the international number as digits only. Phones are stored as
 * typed ("0300 1234567", "+92 300 1234567", "0092300…"); local Pakistani
 * numbers get the 92 country code. Returns null when it can't be a number.
 */
export function toWhatsAppNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("3")) digits = `92${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

/** Chat link to a specific person (e.g. the rider), with a prefilled message. */
export function whatsappChatUrl(phone: string, message: string) {
  const number = toWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
