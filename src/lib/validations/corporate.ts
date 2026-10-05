import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^[+\d\s()-]+$/, "Enter a valid phone number")
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 10 && digits <= 13;
  }, "Enter a valid phone number, e.g. 0300 1234567");

export const corporateRequestSchema = z.object({
  companyName: z.string().trim().min(2, "Enter your company name").max(120),
  contactPerson: z.string().trim().min(2, "Enter a contact person").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid work email").max(160),
  phone,
  employees: z.coerce.number({ invalid_type_error: "Enter the number of employees" }).int().min(5, "Corporate plans start at 5 employees").max(5000),
  area: z.string().trim().min(2, "Enter your office area").max(120),
  notes: z.string().trim().max(1000).optional().or(z.literal(""))
});

export type CorporateRequestInput = z.infer<typeof corporateRequestSchema>;

const money = (label: string) => z.coerce.number({ invalid_type_error: `Enter ${label}` }).int(`${label} must be whole rupees`).min(0).max(10_000_000);

export const corporateQuoteSchema = z.object({
  pricePerMeal: money("price per meal").refine((value) => value > 0, "Price per meal must be above 0"),
  mealsPerDay: z.coerce.number().int().min(1, "At least 1 meal per day").max(5000),
  serviceDays: z.coerce.number().int().min(1, "At least 1 service day").max(366),
  schedule: z.string().trim().min(2, "Describe the schedule, e.g. Mon–Fri").max(120),
  deliveryCharges: money("delivery charges"),
  discount: money("discount"),
  validDays: z.coerce.number().int().min(1).max(90),
  notes: z.string().trim().max(1000).optional().or(z.literal(""))
});

export type CorporateQuoteInput = z.infer<typeof corporateQuoteSchema>;

/** Quote totals, computed on the server. */
export function calculateQuoteTotals(input: Pick<CorporateQuoteInput, "pricePerMeal" | "mealsPerDay" | "serviceDays" | "deliveryCharges" | "discount">) {
  const subtotal = input.pricePerMeal * input.mealsPerDay * input.serviceDays;
  const discount = Math.min(input.discount, subtotal + input.deliveryCharges);
  return { subtotal, discount, total: subtotal + input.deliveryCharges - discount };
}
