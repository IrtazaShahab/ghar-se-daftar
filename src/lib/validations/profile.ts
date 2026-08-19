import { z } from "zod";

export const profileSettingsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  companyName: z.string().trim().max(120).optional(),
  officeAddress: z.string().trim().max(500).optional(),
  deliveryArea: z.string().trim().max(120).optional(),
  deliveryInstructions: z.string().trim().max(500).optional()
});
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
