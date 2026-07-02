"use client";

import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/utils";
import { generateSubscriptionInquiryMessage } from "@/lib/order";
import Link from "next/link";

export interface WhatsAppButtonProps {
  message?: string;
  className?: string;
  variant?: "floating" | "inline";
}

export function WhatsAppButton({
  message = generateSubscriptionInquiryMessage(),
  className = "",
  variant = "floating"
}: WhatsAppButtonProps) {
  const href = whatsappUrl(message);

  if (variant === "floating") {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition transform hover:scale-110 ${className}`}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition focus-ring text-sm ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      <span>Order on WhatsApp</span>
    </Link>
  );
}
