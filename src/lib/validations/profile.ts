import { z } from "zod";

/** Address fields must never hold an email (browser autofill sometimes puts one there). */
const placeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !/\S+@\S+/.test(value), "This looks like an email address. Enter a place name instead.")
    .optional();

export const profileSettingsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  companyName: z.string().trim().max(120).optional(),
  officeAddress: placeText(500),
  deliveryArea: placeText(120),
  deliveryInstructions: z.string().trim().max(500).optional()
});
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
