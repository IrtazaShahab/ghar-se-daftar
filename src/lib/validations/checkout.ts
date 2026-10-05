import { z } from "zod";
import { DELIVERY_SLOTS } from "@/lib/orders/format";

/** Shared by the checkout form (client) and placeOrder (server). */

/** 03001234567, +92 300 1234567 and landlines all have 10–13 digits. */
function isValidPakistaniPhone(value: string) {
  if (!/^[+\d\s()-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

const phone = z
  .string()
  .trim()
  .min(10, "Enter a valid phone number")
  .max(20, "Enter a valid phone number")
  .refine(isValidPakistaniPhone, "Enter a valid phone number, e.g. 0300 1234567");

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const CUSTOMER_PAYMENT_METHODS = ["EASYPAISA", "COD", "CARD"] as const;
export type CustomerPaymentMethod = (typeof CUSTOMER_PAYMENT_METHODS)[number];

export const checkoutDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  phone,
  whatsappNumber: phone.optional().or(z.literal("")),
  company: optionalText(120),
  area: z.string().trim().min(2, "Enter your delivery area").max(120),
  address: z.string().trim().min(5, "Enter your full office address").max(500),
  deliverySlot: z.enum(DELIVERY_SLOTS.map((slot) => slot.value) as [string, ...string[]], {
    errorMap: () => ({ message: "Choose a delivery time" })
  }),
  instructions: optionalText(500),
  paymentMethod: z.enum(CUSTOMER_PAYMENT_METHODS, { errorMap: () => ({ message: "Choose a payment method" }) })
});

export type CheckoutDetailsInput = z.infer<typeof checkoutDetailsSchema>;

export const cartLinesSchema = z
  .array(
    z.object({
      menuOptionId: z.string().trim().min(1).max(64),
      quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum 50 per item")
    })
  )
  .min(1, "Your cart is empty")
  .max(30, "Too many different items in one order");

export type CartLineInput = z.infer<typeof cartLinesSchema>[number];

export const placeOrderSchema = checkoutDetailsSchema.extend({
  items: cartLinesSchema,
  idempotencyKey: z.string().uuid()
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
