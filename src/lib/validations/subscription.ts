import { z } from "zod";

export const subscriptionRequestSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().min(10).max(20),
  officeAddress: z.string().min(10).max(500),
  plan: z.enum(["single", "weekly", "monthly"]),
  notes: z.string().max(500).optional()
});

export const corporateRequestSchema = z.object({
  companyName: z.string().min(2).max(120),
  contactPerson: z.string().min(2).max(80),
  phone: z.string().min(10).max(20),
  employees: z.coerce.number().min(5).max(5000),
  area: z.string().min(2).max(120),
  notes: z.string().max(1000).optional()
});
