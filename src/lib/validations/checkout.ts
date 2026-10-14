import { z } from "zod";

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

/** Browser autofill sometimes drops an email into address fields; never accept one. */
export function looksLikeEmail(value: string) {
  return /\S+@\S+/.test(value);
}

const placeText = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .min(min, message)
    .max(max)
    .refine((value) => !looksLikeEmail(value), "This looks like an email address. Enter a place name instead.")
    .refine((value) => /\p{L}/u.test(value), message);

/** Rough bounding box of Pakistan; a pin outside it is a mistake, not a delivery. */
const PAKISTAN_BOUNDS = { minLat: 23.5, maxLat: 37.2, minLng: 60.8, maxLng: 77.9 };

export const checkoutDetailsSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    phone,
    whatsappNumber: phone.optional().or(z.literal("")),
    company: optionalText(120),
    area: placeText(2, 120, "Enter your delivery area, e.g. Gulberg"),
    address: placeText(5, 500, "Enter your full office address"),
    city: z.string().trim().max(60).optional().or(z.literal("")),
    /** Set only when the customer picked a place or moved the map pin. */
    latitude: z.number().finite().optional().nullable(),
    longitude: z.number().finite().optional().nullable(),
    deliverySlot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/, "Choose a delivery time"),
    instructions: optionalText(500),
    paymentMethod: z.enum(CUSTOMER_PAYMENT_METHODS, { errorMap: () => ({ message: "Choose a payment method" }) })
  })
  .superRefine((value, ctx) => {
    const hasLat = typeof value.latitude === "number";
    const hasLng = typeof value.longitude === "number";
    if (hasLat !== hasLng) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "The map location is incomplete. Choose the address again." });
      return;
    }
    if (hasLat && hasLng) {
      const { minLat, maxLat, minLng, maxLng } = PAKISTAN_BOUNDS;
      if (value.latitude! < minLat || value.latitude! > maxLat || value.longitude! < minLng || value.longitude! > maxLng) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Choose a delivery location in Pakistan." });
      }
    }
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

export const placeOrderSchema = checkoutDetailsSchema.and(
  z.object({
    items: cartLinesSchema,
    idempotencyKey: z.string().uuid()
  })
);

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

/** Saved profile values used as form defaults: drop anything that is clearly not a place. */
export function placeDefault(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed && !looksLikeEmail(trimmed) ? trimmed : "";
}
